from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: str
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    APP_PORT: int = 8000
    ENV: str = "development"

    # gemini-1.5-flash has the highest free-tier quota and stability
    GEMINI_TEXT_MODEL: str = "gemini-1.5-flash"
    GEMINI_VISION_MODEL: str = "gemini-1.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    GEMINI_TEMPERATURE: float = 0.2

    # Fallback models
    GEMINI_FALLBACK_MODELS: list = ["gemini-1.5-flash", "gemini-1.5-pro"]

    REQUEST_TIMEOUT: int = 30
    CACHE_SIMILARITY_THRESHOLD: float = 0.85
    RATE_LIMIT_ANALYZE: int = 100
    RATE_LIMIT_GENERATE: int = 50
    RATE_LIMIT_RECOVER: int = 50
    RATE_LIMIT_IMAGE: int = 20
    DB_POOL_MIN: int = 1
    DB_POOL_MAX: int = 4


    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
