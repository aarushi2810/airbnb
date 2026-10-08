"""routers/misc.py — Amenities, categories, and optional image upload."""

import os
import uuid
from typing import Optional

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_required_user
from app.models.listing import Amenity, Category
from app.models.user import User
from app.schemas.listing import AmenityOut, CategoryOut

router = APIRouter(prefix="/api", tags=["misc"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")


@router.get("/amenities", response_model=list[AmenityOut])
def list_amenities(db: Session = Depends(get_db)):
    return db.execute(select(Amenity).order_by(Amenity.category, Amenity.name)).scalars().all()


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.execute(select(Category).order_by(Category.id)).scalars().all()


@router.post("/uploads")
async def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(get_required_user),
):
    """Save an uploaded image to the local /uploads folder and return its URL."""
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Only JPEG, PNG, and WebP images are allowed")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    # URL that FastAPI serves via StaticFiles (mounted in main.py)
    return {"url": f"/uploads/{filename}"}
