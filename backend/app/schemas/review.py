"""schemas/review.py — Pydantic v2 schemas for Review."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserOut


class ReviewCreate(BaseModel):
    booking_id: Optional[int] = None
    rating: float = Field(..., ge=1, le=5)
    cleanliness: Optional[float] = Field(None, ge=1, le=5)
    accuracy: Optional[float] = Field(None, ge=1, le=5)
    communication: Optional[float] = Field(None, ge=1, le=5)
    location: Optional[float] = Field(None, ge=1, le=5)
    checkin: Optional[float] = Field(None, ge=1, le=5)
    value: Optional[float] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    author_id: int
    booking_id: Optional[int] = None
    rating: float
    cleanliness: Optional[float] = None
    accuracy: Optional[float] = None
    communication: Optional[float] = None
    location: Optional[float] = None
    checkin: Optional[float] = None
    value: Optional[float] = None
    comment: Optional[str] = None
    created_at: datetime
    author: Optional[UserOut] = None


class ReviewsPage(BaseModel):
    items: list[ReviewOut]
    total: int
    page: int
    has_more: bool
    # Average category ratings across all reviews
    avg_cleanliness: Optional[float] = None
    avg_accuracy: Optional[float] = None
    avg_communication: Optional[float] = None
    avg_location: Optional[float] = None
    avg_checkin: Optional[float] = None
    avg_value: Optional[float] = None
