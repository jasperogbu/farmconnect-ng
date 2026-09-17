"""User accounts: farmers, buyers and administrators."""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    """The three account types supported by the platform."""

    farmer = "farmer"
    buyer = "buyer"
    admin = "admin"


class User(SQLModel, table=True):
    """A platform account.

    The ``role`` field determines which dashboard a user is routed to after
    login and what actions they are permitted to perform.
    """

    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(index=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    role: UserRole = Field(default=UserRole.buyer, index=True)

    phone: Optional[str] = Field(default=None)
    state: Optional[str] = Field(default=None, index=True)
    city: Optional[str] = Field(default=None)
    address: Optional[str] = Field(default=None)
    bio: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)

    is_active: bool = Field(default=True)

    # Aggregated farmer reputation (kept in sync when reviews are created).
    rating: float = Field(default=0.0)
    total_reviews: int = Field(default=0)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
