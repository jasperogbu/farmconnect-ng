"""Image uploads (used for product photos and avatars)."""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.models import User

router = APIRouter(prefix="/uploads", tags=["Uploads"])

UPLOAD_DIR = settings.upload_dir


def ensure_upload_dir() -> None:
    """Create the upload directory on demand, with a clear error if unwritable."""
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload directory is not writable: {UPLOAD_DIR}",
        ) from exc

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


@router.post("", response_model=dict)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Store an uploaded image and return its public URL path."""
    ensure_upload_dir()
    extension = Path(file.filename or "").suffix.lower()
    if file.content_type not in ALLOWED_TYPES and extension not in ALLOWED_EXT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WEBP or GIF images are allowed.",
        )

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image must be smaller than {settings.MAX_UPLOAD_MB}MB.",
        )

    filename = f"{uuid.uuid4().hex}{extension or '.jpg'}"
    (UPLOAD_DIR / filename).write_bytes(contents)
    return {"url": f"/uploads/{filename}"}
