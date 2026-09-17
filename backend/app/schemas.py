"""Pydantic request/response schemas for the FarmConnect NG API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import OrderStatus, ReportStatus, UserRole

# ---------------------------------------------------------------------------
# Generic
# ---------------------------------------------------------------------------


class MessageOut(BaseModel):
    message: str


# ---------------------------------------------------------------------------
# Users & authentication
# ---------------------------------------------------------------------------


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_.]+$")
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: UserRole = UserRole.buyer
    phone: Optional[str] = Field(default=None, max_length=20)
    state: Optional[str] = Field(default=None, max_length=60)
    city: Optional[str] = Field(default=None, max_length=80)
    address: Optional[str] = Field(default=None, max_length=200)


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=20)
    state: Optional[str] = Field(default=None, max_length=60)
    city: Optional[str] = Field(default=None, max_length=80)
    address: Optional[str] = Field(default=None, max_length=200)
    bio: Optional[str] = Field(default=None, max_length=1000)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    username: str
    role: UserRole
    phone: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    rating: float = 0
    total_reviews: int = 0
    created_at: datetime


class UserAdmin(UserPublic):
    email: EmailStr
    is_active: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class AccountStatusUpdate(BaseModel):
    is_active: bool


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=2, max_length=60)
    description: str = Field(default="", max_length=2000)
    quantity: float = Field(gt=0)
    unit: str = Field(default="kg", max_length=20)
    price: float = Field(gt=0)
    state: Optional[str] = Field(default=None, max_length=60)
    city: Optional[str] = Field(default=None, max_length=80)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = Field(default=None, max_length=500)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    category: Optional[str] = Field(default=None, min_length=2, max_length=60)
    description: Optional[str] = Field(default=None, max_length=2000)
    quantity: Optional[float] = Field(default=None, ge=0)
    unit: Optional[str] = Field(default=None, max_length=20)
    price: Optional[float] = Field(default=None, gt=0)
    state: Optional[str] = Field(default=None, max_length=60)
    city: Optional[str] = Field(default=None, max_length=80)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = Field(default=None, max_length=500)
    is_available: Optional[bool] = None


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farmer_id: int
    name: str
    category: str
    description: str
    quantity: float
    unit: str
    price: float
    state: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    is_available: bool
    is_removed: bool
    rating: float
    total_reviews: int
    created_at: datetime
    updated_at: datetime

    # Joined convenience fields
    farmer_name: Optional[str] = None
    farmer_rating: Optional[float] = None


class ProductPage(BaseModel):
    items: list[ProductRead]
    total: int
    page: int
    page_size: int
    pages: int


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------


class OrderCreate(BaseModel):
    product_id: int
    quantity: float = Field(gt=0)
    delivery_state: Optional[str] = Field(default=None, max_length=60)
    delivery_city: Optional[str] = Field(default=None, max_length=80)
    delivery_address: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=1000)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    buyer_id: int
    farmer_id: int
    product_id: Optional[int] = None
    product_name: str
    unit: str
    quantity: float
    unit_price: float
    total_price: float
    status: OrderStatus
    delivery_state: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    buyer_name: Optional[str] = None
    farmer_name: Optional[str] = None
    product_image: Optional[str] = None
    reviewed: bool = False


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------


class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=1000)


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    buyer_id: int
    product_id: int
    farmer_id: int
    order_id: Optional[int] = None
    rating: int
    comment: str
    created_at: datetime
    buyer_name: Optional[str] = None


# ---------------------------------------------------------------------------
# Messaging
# ---------------------------------------------------------------------------


class ConversationCreate(BaseModel):
    other_user_id: int


class ConversationRead(BaseModel):
    id: int
    other_user: UserPublic
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    updated_at: datetime


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------


class ReportCreate(BaseModel):
    product_id: Optional[int] = None
    reported_user_id: Optional[int] = None
    reason: str = Field(min_length=3, max_length=120)
    details: Optional[str] = Field(default=None, max_length=2000)


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reporter_id: int
    product_id: Optional[int] = None
    reported_user_id: Optional[int] = None
    reason: str
    details: Optional[str] = None
    status: ReportStatus
    resolution_note: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    reporter_name: Optional[str] = None
    product_name: Optional[str] = None
    reported_username: Optional[str] = None


class ReportResolve(BaseModel):
    status: ReportStatus
    resolution_note: Optional[str] = Field(default=None, max_length=500)


# ---------------------------------------------------------------------------
# Dashboards & statistics
# ---------------------------------------------------------------------------


class FarmerDashboard(BaseModel):
    total_products: int
    active_products: int
    total_orders: int
    pending_orders: int
    delivered_orders: int
    total_earnings: float
    rating: float
    total_reviews: int
    recent_orders: list[OrderRead]


class BuyerDashboard(BaseModel):
    total_orders: int
    pending_orders: int
    delivered_orders: int
    recent_orders: list[OrderRead]
    recommended_products: list[ProductRead]


class AdminStats(BaseModel):
    total_users: int
    farmers: int
    buyers: int
    admins: int
    total_products: int
    active_products: int
    removed_products: int
    total_orders: int
    orders_by_status: dict[str, int]
    total_messages: int
    open_reports: int
    signups_last_7_days: int
    top_states: list[dict]
