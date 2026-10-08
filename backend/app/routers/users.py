"""routers/users.py — User endpoints for mock authentication."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_required_user
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    """Return all seeded users — used by the mock login modal."""
    users = db.execute(select(User).order_by(User.id)).scalars().all()
    return users


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_required_user)):
    """Return the currently authenticated user."""
    return user
