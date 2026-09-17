"""Content and user reports raised for administrator review."""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class ReportStatus(str, Enum):
    open = "open"
    resolved = "resolved"
    dismissed = "dismissed"


class Report(SQLModel, table=True):
    """A report submitted by a user about a product or another user."""

    __tablename__ = "reports"

    id: Optional[int] = Field(default=None, primary_key=True)
    reporter_id: int = Field(foreign_key="users.id", index=True)

    product_id: Optional[int] = Field(default=None, foreign_key="products.id")
    reported_user_id: Optional[int] = Field(default=None, foreign_key="users.id")

    reason: str
    details: Optional[str] = Field(default=None)

    status: ReportStatus = Field(default=ReportStatus.open, index=True)
    resolution_note: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    resolved_at: Optional[datetime] = Field(default=None)
