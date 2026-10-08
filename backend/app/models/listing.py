"""models/listing.py — Listing, ListingImage, Amenity, ListingAmenity, Category."""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Enum, Float, ForeignKey, Index,
    Integer, Numeric, String, Text, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# --------------------------------------------------------------------------- #
# Many-to-Many join table: listing ↔ amenity                                  #
# --------------------------------------------------------------------------- #
class ListingAmenity(Base):
    __tablename__ = "listing_amenities"

    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True
    )
    amenity_id: Mapped[int] = mapped_column(
        ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True
    )


# --------------------------------------------------------------------------- #
# Amenity master list                                                          #
# --------------------------------------------------------------------------- #
class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(50))       # lucide icon name
    category: Mapped[Optional[str]] = mapped_column(String(50))   # e.g. "Bathroom", "Kitchen"

    listings: Mapped[list["Listing"]] = relationship(
        "Listing", secondary="listing_amenities", back_populates="amenities"
    )


# --------------------------------------------------------------------------- #
# Category (used for the icon row on the homepage)                            #
# --------------------------------------------------------------------------- #
class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(50))   # lucide or emoji
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    listings: Mapped[list["Listing"]] = relationship("Listing", back_populates="category_rel")


# --------------------------------------------------------------------------- #
# Listing                                                                      #
# --------------------------------------------------------------------------- #
class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    property_type: Mapped[Optional[str]] = mapped_column(String(60))   # e.g. "Villa"
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    room_type: Mapped[str] = mapped_column(
        Enum("entire_home", "private_room", "shared_room", name="room_type"),
        nullable=False,
        default="entire_home",
    )

    # Location
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[Optional[str]] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(300))
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)

    # Pricing (stored as Numeric for exactness, returned as float in schemas)
    price_per_night: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    cleaning_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)

    # Capacity / rooms
    max_guests: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    bedrooms: Mapped[int] = mapped_column(Integer, default=1)
    beds: Mapped[int] = mapped_column(Integer, default=1)
    bathrooms: Mapped[float] = mapped_column(Float, default=1.0)

    # Aggregate rating (recomputed when a review is added)
    rating_avg: Mapped[float] = mapped_column(Float, default=0.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    is_guest_favorite: Mapped[bool] = mapped_column(Boolean, default=False)

    status: Mapped[str] = mapped_column(
        Enum("active", "inactive", name="listing_status"), default="active"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    host: Mapped["User"] = relationship("User", back_populates="listings")  # type: ignore[name-defined]
    images: Mapped[list["ListingImage"]] = relationship(
        "ListingImage", back_populates="listing", cascade="all, delete-orphan",
        order_by="ListingImage.position",
    )
    amenities: Mapped[list["Amenity"]] = relationship(
        "Amenity", secondary="listing_amenities", back_populates="listings"
    )
    category_rel: Mapped[Optional["Category"]] = relationship("Category", back_populates="listings")
    bookings: Mapped[list["Booking"]] = relationship(  # type: ignore[name-defined]
        "Booking", back_populates="listing", cascade="all, delete-orphan"
    )
    reviews: Mapped[list["Review"]] = relationship(  # type: ignore[name-defined]
        "Review", back_populates="listing", cascade="all, delete-orphan"
    )
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(  # type: ignore[name-defined]
        "WishlistItem", back_populates="listing", cascade="all, delete-orphan"
    )


# --------------------------------------------------------------------------- #
# Listing Images                                                               #
# --------------------------------------------------------------------------- #
class ListingImage(Base):
    __tablename__ = "listing_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0)  # 0 = cover photo

    listing: Mapped["Listing"] = relationship("Listing", back_populates="images")
