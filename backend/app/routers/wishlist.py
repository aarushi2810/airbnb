"""routers/wishlist.py — Wishlist toggle and retrieval."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_db, get_required_user
from app.models.listing import Listing
from app.models.user import User
from app.models.wishlist import WishlistItem
from app.schemas.listing import ListingCard, ListingImageOut

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


def _to_card(listing: Listing, is_wishlisted: bool = True) -> ListingCard:
    images = [ListingImageOut.model_validate(img) for img in listing.images]
    return ListingCard(
        id=listing.id,
        title=listing.title,
        city=listing.city,
        state=listing.state,
        country=listing.country,
        price_per_night=float(listing.price_per_night),
        cleaning_fee=float(listing.cleaning_fee),
        rating_avg=listing.rating_avg,
        review_count=listing.review_count,
        is_guest_favorite=listing.is_guest_favorite,
        room_type=listing.room_type,
        max_guests=listing.max_guests,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        bathrooms=listing.bathrooms,
        category_id=listing.category_id,
        cover_image=images[0].url if images else None,
        images=images,
        is_wishlisted=is_wishlisted,
    )


@router.get("", response_model=list[ListingCard])
def get_wishlist(db: Session = Depends(get_db), user: User = Depends(get_required_user)):
    """Return all wishlisted listings for the current user."""
    items = db.execute(
        select(WishlistItem)
        .options(joinedload(WishlistItem.listing).joinedload(Listing.images))
        .where(WishlistItem.user_id == user.id)
        .order_by(WishlistItem.created_at.desc())
    ).scalars().all()
    return [_to_card(item.listing) for item in items]


@router.post("/{listing_id}", status_code=201)
def add_to_wishlist(
    listing_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_required_user),
):
    """Add a listing to the user's wishlist (idempotent)."""
    existing = db.get(WishlistItem, (user.id, listing_id))
    if existing:
        return {"wishlisted": True}  # already there — no error
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    db.add(WishlistItem(user_id=user.id, listing_id=listing_id))
    db.commit()
    return {"wishlisted": True}


@router.delete("/{listing_id}", status_code=200)
def remove_from_wishlist(
    listing_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_required_user),
):
    """Remove a listing from the user's wishlist."""
    item = db.get(WishlistItem, (user.id, listing_id))
    if item:
        db.delete(item)
        db.commit()
    return {"wishlisted": False}
