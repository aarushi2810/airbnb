"""models/__init__.py — import all models so metadata is populated."""

from app.models.user import User
from app.models.listing import Listing, ListingImage, Amenity, ListingAmenity, Category
from app.models.booking import Booking
from app.models.review import Review
from app.models.wishlist import WishlistItem

__all__ = [
    "User", "Listing", "ListingImage", "Amenity", "ListingAmenity",
    "Category", "Booking", "Review", "WishlistItem",
]
