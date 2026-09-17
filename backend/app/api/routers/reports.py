"""User-submitted reports about products or accounts."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.core.database import get_session
from app.models import Product, Report, User
from app.schemas import ReportCreate, ReportRead

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("", response_model=ReportRead, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ReportRead:
    """Report a listing or a user for administrator review."""
    if payload.product_id is None and payload.reported_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide a product or user to report.",
        )
    if payload.product_id is not None and session.get(Product, payload.product_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    if payload.reported_user_id is not None and session.get(User, payload.reported_user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    report = Report(reporter_id=current_user.id, **payload.model_dump())
    session.add(report)
    session.commit()
    session.refresh(report)

    result = ReportRead.model_validate(report)
    result.reporter_name = current_user.full_name
    return result


@router.get("/mine", response_model=list[ReportRead])
def my_reports(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[ReportRead]:
    reports = session.exec(
        select(Report)
        .where(Report.reporter_id == current_user.id)
        .order_by(Report.created_at.desc())
    ).all()
    result = []
    for report in reports:
        item = ReportRead.model_validate(report)
        item.reporter_name = current_user.full_name
        result.append(item)
    return result
