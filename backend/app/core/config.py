"""Application configuration loaded from environment variables."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Typed application settings.

    Values are read from the process environment or from a local ``.env`` file.
    """

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR.parent / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application metadata
    APP_NAME: str = "FarmConnect NG"
    APP_DESCRIPTION: str = "Nigeria's direct farmer-to-buyer agricultural marketplace"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    # Security
    SECRET_KEY: str = "change-this-to-a-long-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "sqlite:///./farmconnect.db"

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Bootstrap administrator (created on startup if missing; override in production)
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@farmconnect.ng"
    ADMIN_PASSWORD: str = "Admin@123"
    ADMIN_FULL_NAME: str = "admin"

    # File uploads
    MAX_UPLOAD_MB: int = 5
    # Optional absolute path for uploaded images (e.g. a mounted disk on Render).
    # Defaults to <backend>/uploads when empty.
    UPLOAD_DIR: str = ""

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def upload_dir(self) -> Path:
        """Absolute path to the directory that stores uploaded images."""
        return Path(self.UPLOAD_DIR) if self.UPLOAD_DIR else BASE_DIR / "uploads"


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""
    return Settings()


settings = get_settings()
