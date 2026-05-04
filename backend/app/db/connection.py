import asyncpg
from app.core.config import settings
from app.core.logging import logger

_pool = None

async def init_pool():
    global _pool
    # Clean the DSN if it has postgres:// (asyncpg preferred postgresql://)
    dsn = settings.DATABASE_URL.replace("postgres://", "postgresql://")
    
    for attempt in range(3):
        try:
            # Neon requires SSL by default. We use ssl="require" and add a timeout.
            _pool = await asyncpg.create_pool(
                dsn,
                min_size=settings.DB_POOL_MIN,
                max_size=settings.DB_POOL_MAX,
                ssl="require",
                command_timeout=60,
                max_inactive_connection_lifetime=300,
                timeout=10 # Handshake timeout
            )
            logger.info("neon_database_pool_initialized")
            return
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt+1} failed: {e}")
            if attempt < 2:
                import asyncio
                await asyncio.sleep(2) # Wait before retry
            else:
                logger.error("neon_database_pool_init_failed", error=str(e))
                raise

async def close_pool():
    if _pool:
        await _pool.close()
        logger.info("neon_database_pool_closed")

def get_pool():
    if not _pool:
        raise RuntimeError("Neon Pool not initialized")
    return _pool
