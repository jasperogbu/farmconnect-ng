"""Database engine and session management (SQLModel / SQLAlchemy)."""

from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from .config import settings

if settings.is_sqlite:
    _connect_args = {"check_same_thread": False}
    _engine_kwargs: dict = {}
else:
    # Server-side prepared statements are not safe behind a transaction-pooling
    # PgBouncer (Neon's -pooler endpoint): one client's prepared statement can be
    # reused by another, failing with "prepared statement already exists".
    _connect_args = {"prepare_threshold": None}
    # Managed Postgres drops idle connections when the compute suspends, so
    # pre-ping discards dead ones instead of surfacing them as request errors.
    _engine_kwargs = {"pool_pre_ping": True}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=_connect_args,
    **_engine_kwargs,
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
