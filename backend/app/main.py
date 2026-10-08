"""app/main.py — FastAPI application factory.

Registers all routers, mounts the uploads folder as a static directory,
enables CORS for the Next.js frontend, and creates all DB tables on startup
(create_all is idempotent and safe for development; use Alembic in production).
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
import app.models  # noqa: F401 — ensures all models are imported before create_all
from app.routers import bookings, host, listings, misc, users, wishlist


UPLOAD_DIR = os.getenv(

    "UPLOAD_DIR",

    os.path.join(os.path.dirname(__file__), "..", "uploads"),

)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all tables on startup (safe / idempotent)."""
    Base.metadata.create_all(bind=engine)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    yield
    # Shutdown hook (nothing needed for SQLite)


app = FastAPI(
    title="Airbnb Clone API",
    description="Backend for the Airbnb clone take-home assignment.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────── #
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Vercel preview URLs follow this pattern:
        "https://airbnb-nine-jade.vercel.app",
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static uploads ────────────────────────────────────────────────────────── #
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────── #
app.include_router(users.router)
app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(wishlist.router)
app.include_router(host.router)
app.include_router(misc.router)


@app.get("/", tags=["health"])
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "docs": "/docs"}
