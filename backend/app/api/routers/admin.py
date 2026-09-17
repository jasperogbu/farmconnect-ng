"""Administrator endpoints: statistics, user and content moderation."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, func, select

from app.api.deps import get_current_admin
from app.core.database import get_session
from app.models import Message, Order, OrderStatus, Product, Report, ReportStatus, User, UserRole
from app.schemas import (
    AccountStatusUpdate,
    AdminStats,
    ProductRead,
    ReportRead,
    ReportResolve,
    UserAdmin,
)
from app.utils.serializers import product_to_read

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/stats", response_model=AdminStats)
def stats(
    _: User = Depends(get_current_admin),
    session: Session = Depends(get_session),
) -> AdminStats:
    users = session.exec(select(User)).all()
    role_counts = {
        role.value: sum(1 for u in users if u.role == role) for role in UserRole
    }

    products = session.exec(select(Product)).all()

    orders = session.exec(select(Order)).all()
    orders_by_status = {s.value: 0 for s in OrderStatus}
    for order in orders:
        orders_by_status[order.status.value] += 1

    total_messages = session.exec(select(func.count(Message.id))).one()
    open_reports = session.exec(
        select(func.count(Report.id)).where(Report.status == ReportStatus.open)
    ).one()

    cutoff = datetime.utcnow() - timedelta(days=7)
    signups = sum(1 for u in users if u.created_at >= cutoff)

    top_states_rows = session.exec(
        select(Product.state, func.count(Product.id))
        .where(Product.state.is_not(None))  # type: ignore[attr-defined]
        .group_by(Product.state)
        .order_by(func.count(Product.id).desc())
        .limit(5)
    ).all()

    return AdminStats(
        total_users=len(users),
        farmers=role_counts.get("farmer", 0),
        buyers=role_counts.get("buyer", 0),
        admins=role_counts.get("admin", 0),
        total_products=len(products),
        active_products=sum(1 for p in products if p.is_available and not p.is_removed),
        removed_products=sum(1 for p in products if p.is_removed),
        total_orders=len(orders),
        orders_by_status=orders_by_status,
        total_messages=int(total_messages or 0),
        open_reports=int(open_reports or 0),
        signups_last_7_days=signups,
        top_states=[{"state": row[0], "count": row[1]} for row in top_states_rows],
    )


@router.get("/users", response_model=list[UserAdmin])
def list_users(
    role: UserRole | None = Query(default=None),
    q: str | None = Query(default=None),
    _: User = Depends(get_current_admin),
    session: Session = Depends(get_session),
) -> list[UserAdmin]:
    statement = select(User)
    if role:
        statement = statement.where(User.role == role)
    if q:
        like = f"%{q.lower()}%"
        statement = statement.where(
            func.lower(User.full_name).like(like)
            | func.lower(User.username).like(like)
            | func.lower(User.email).like(like)
        )
    users = session.exec(statement.order_by(User.created_at.desc())).all()
    return [UserAdmin.model_validate(u) for u in users]


@router.patch("/users/{user_id}/status", response_model=UserAdmin)
def set_user_status(
    user_id: int,
    payload: AccountStatusUpdate,
    admin: User = Depends(get_current_admin),
    session: Session = Depends(get_session),
) -> UserAdmin:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )
    user.is_active = payload.is_active
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserAdmin.model_validate(user)


@router.delete("/users/{user_id}", response_model=dict)
def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    session: Session = Depends(get_session),
) -> dict:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )
    # Remove the user's listings, then the account itself.
    for product in session.exec(select(Product).where(Product.farmer_id == user.id)).all():
        session.delete(product)
    session.delete(user)
    session.commit()
    return {"message": "User removed."}


@router.get("/products", response_model=list[ProductRead])
def list_all_products(
    removed_only: bool = Query(default=False),
    _: User = Depends(get_current_admin),
    session: Session = Depends(get_session),
) -> list[ProductRead]:
    statement = select(Product)
    if removed_only:
        statement = statement.where(Product.is_removed == True)  # noqa: E712
    products = session.exec(statement.order_by(Product.created_at.desc())).all()
    farmer_ids = {p.farmer_id for p in products}
    farmers = {
        u.id: u for u in session.exec(select(User).where(User.id.in_(farmer_ids))).all()
    } if farmer_ids else {}
    return [product_to_read(p, farmers.get(p.farmer_id)) for p in products]


@router.patch("/products/{product_id}/remove", response_model=ProductRead)
def toggle_product_removal(
    product_id: int,
    _: User = Depends(get_current_admin),
    session: Session = Depends(get_session),
) -> ProductRead:
    """Flag or restore a listing that violates platform rules."""
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    product.is_removed = not product.is_removed
    product.is_available = not product.is_removed
    session.add(product)
    session.commit()
    session.refresh(product)
    return product_to_read(product, session.get(User, product.farmer_id))


@router.delete("/products/{product_id}", response_model=dict)
def delete_product(
    product_id: int,
    _: User = Depends(get_current_admin),
    session: Session = Depends(get_session),
) -> dict:
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    session.delete(product)
    session.commit()
    return {"message": "Listing deleted."}


@router.get("/reports", response_model=list[ReportRead])
def list_reports(
    report_status: ReportStatus | None = Query(default=None, alias="status"),
    _: User = Depends(get_current_admin),
    session: Session = Depends(get_session),
) -> list[ReportRead]:
    statement = select(Report)
    if report_status:
        statement = statement.where(Report.status == report_status)
    reports = session.exec(statement.order_by(Report.created_at.desc())).all()

    user_ids = {r.reporter_id for r in reports} | {
        r.reported_user_id for r in reports if r.reported_user_id
    }
    users = {u.id: u for u in session.exec(select(User).where(User.id.in_(user_ids))).all()} if user_ids else {}
    product_ids = {r.product_id for r in reports if r.product_id}
    products = {p.id: p for p in session.exec(select(Product).where(Product.id.in_(product_ids))).all()} if product_ids else {}

    result = []
    for report in reports:
        item = ReportRead.model_validate(report)
        reporter = users.get(report.reporter_id)
        item.reporter_name = reporter.username if reporter else None
        if report.reported_user_id and report.reported_user_id in users:
            item.reported_username = users[report.reported_user_id].username
        if report.product_id and report.product_id in products:
            item.product_name = products[report.product_id].name
        result.append(item)
    return result


@router.patch("/reports/{report_id}", response_model=ReportRead)
def resolve_report(
    report_id: int,
    payload: ReportResolve,
    _: User = Depends(get_current_admin),
    session: Session = Depends(get_session),
) -> ReportRead:
    report = session.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    if payload.status == ReportStatus.open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Choose resolved or dismissed.",
        )
    report.status = payload.status
    report.resolution_note = payload.resolution_note
    report.resolved_at = datetime.utcnow()
    session.add(report)
    session.commit()
    session.refresh(report)
    return ReportRead.model_validate(report)
