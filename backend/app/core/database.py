"""Database engine and session management (SQLModel / SQLAlchemy)."""

from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from .config import settings

_connect_args = {"check_same_thread": False} if settings.is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=_connect_args,
)


def init_db() -> None:
    """Create all database tables if they do not already exist."""
    # Importing the package registers every model on SQLModel.metadata.
    from app import models  # noqa: F401  (side-effect import)

    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    with Session(engine) as session:
        yield session
