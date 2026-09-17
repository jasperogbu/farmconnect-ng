"""FarmConnect NG - FastAPI application entry point.

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.bootstrap import ensure_admin
from app.core.config import settings
from app.core.database import init_db

# Routers
from app.api.routers import (
    admin,
    auth,
    chat,
    dashboard,
    orders,
    products,
    reports,
    reviews,
    uploads,
    users,
)

UPLOAD_DIR = settings.upload_dir
try:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    pass


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Create database tables and bootstrap the administrator on startup."""
    init_db()
    ensure_admin()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version="1.0.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

allowed_origins = {
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images.
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR, check_dir=False), name="uploads")

# API routers.
prefix = settings.API_PREFIX
app.include_router(auth.router, prefix=prefix)
app.include_router(users.router, prefix=prefix)
app.include_router(products.router, prefix=prefix)
app.include_router(orders.router, prefix=prefix)
app.include_router(reviews.router, prefix=prefix)
app.include_router(chat.router, prefix=prefix)
app.include_router(reports.router, prefix=prefix)
app.include_router(dashboard.router, prefix=prefix)
app.include_router(uploads.router, prefix=prefix)
app.include_router(admin.router, prefix=prefix)


@app.get("/", tags=["Health"])
def root() -> dict:
    return {
        "service": settings.APP_NAME,
        "status": "running",
        "docs": "/docs",
        "api": prefix,
    }


@app.get("/health", tags=["Health"])
def health() -> dict:
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
