"""core/deps.py — FastAPI dependency injection helpers.

get_db: yields a SQLAlchemy session (closed after each request).
get_current_user: reads the X-User-Id header and returns the User ORM
    object. Returns None if the header is absent (guest-browsing mode).
get_required_user: raises 401 if no user is identified.
"""

from typing import Generator, Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User


def get_db() -> Generator[Session, None, None]:
    """Yield a DB session; ensures the session is always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    x_user_id: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return the User for the given X-User-Id header, or None."""
    if x_user_id is None:
        return None
    try:
        uid = int(x_user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-User-Id must be a numeric user ID",
        )
    user = db.get(User, uid)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {uid} not found",
        )
    return user


def get_required_user(
    user: Optional[User] = Depends(get_current_user),
) -> User:
    """Raise 401 if no user is authenticated."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Send X-User-Id header.",
        )
    return user


def get_host_user(user: User = Depends(get_required_user)) -> User:
    """Raise 403 if the authenticated user is not a host."""
    if user.role != "host":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only host accounts can perform this action.",
        )
    return user
