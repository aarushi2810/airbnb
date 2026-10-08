"""schemas/user.py — Pydantic v2 schemas for User."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    name: str
    email: str
    avatar_url: Optional[str] = None
    role: str = "guest"
    is_superhost: bool = False
    bio: Optional[str] = None
    response_rate: Optional[int] = None


class UserOut(UserBase):
    """Returned by GET /api/users and embedded in listings/bookings."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    joined_at: datetime
