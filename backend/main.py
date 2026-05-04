from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.db.connection import init_pool, close_pool
from app.services.templates import seed_templates
from app.api.routes import router, limiter
from slowapi.middleware import SlowAPIMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup logging
    setup_logging()
    
    # Pre-warm everything on startup — zero cold start
    await init_pool()
    # Note: google-genai uses Client instances instead of global config
    await seed_templates()
    
    logger.info("startup_complete")
    yield
    await close_pool()

app = FastAPI(title="PromptV", lifespan=lifespan)

# Setup Proxy Headers Middleware (Essential for Render load balancers)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# Setup Rate Limiting Middleware
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.get("/")
async def root():
    return {"status": "PromptV API is active", "version": "1.0.0"}

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    allow_credentials=True
)

app.include_router(router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.APP_PORT, reload=True)
