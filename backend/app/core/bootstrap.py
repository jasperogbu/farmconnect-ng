"""Startup bootstrap: guarantee a platform administrator exists.

Public registration cannot create administrators, so the platform owner needs a
reliable way to get the first admin account on a fresh deployment (for example a
new Render instance with an empty database). This module creates the bootstrap
admin from settings the first time the app starts, and is safe to run repeatedly.
"""

from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import engine
from app.core.security import hash_password
from app.models import User, UserRole


def ensure_admin() -> None:
    """Create the configured administrator if no such user exists yet."""
    username = (settings.ADMIN_USERNAME or "").strip().lower()
    if not username or not settings.ADMIN_PASSWORD:
        return

    with Session(engine) as session:
        existing = session.exec(select(User).where(User.username == username)).first()
        if existing is not None:
            if existing.role != UserRole.admin:
                existing.role = UserRole.admin
                session.add(existing)
                session.commit()
            return

        admin = User(
            full_name=(settings.ADMIN_FULL_NAME or username).strip(),
            username=username,
            email=(settings.ADMIN_EMAIL or f"{username}@farmconnect.ng").lower(),
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            role=UserRole.admin,
        )
        session.add(admin)
        session.commit()
