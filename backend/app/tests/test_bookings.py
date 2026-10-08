"""tests/test_bookings.py — Tests for booking overlap logic and price calculation."""

import pytest
from datetime import date, timedelta

from app.services.booking_service import check_overlap, create_booking
from app.services.pricing_service import compute_price
from app.schemas.booking import BookingCreate
from app.models.booking import Booking


# ─────────────────────────────────────────────────────────────────────────── #
# Pricing tests                                                                #
# ─────────────────────────────────────────────────────────────────────────── #

def test_price_simple():
    """3 nights × 5000 + 500 cleaning + 14% service fee."""
    result = compute_price(
        check_in=date(2027, 1, 1),
        check_out=date(2027, 1, 4),  # 3 nights
        nightly_rate=5000.0,
        cleaning_fee=500.0,
    )
    assert result["nights"] == 3
    assert result["subtotal"] == 15000.0
    assert result["service_fee"] == round(15000.0 * 0.14, 2)
    assert result["total"] == result["subtotal"] + result["cleaning_fee"] + result["service_fee"]


def test_price_single_night():
    result = compute_price(
        check_in=date(2027, 6, 1),
        check_out=date(2027, 6, 2),
        nightly_rate=1000.0,
        cleaning_fee=200.0,
    )
    assert result["nights"] == 1
    assert result["subtotal"] == 1000.0


def test_price_invalid_dates():
    with pytest.raises(ValueError, match="check_out must be after check_in"):
        compute_price(
            check_in=date(2027, 1, 5),
            check_out=date(2027, 1, 5),
            nightly_rate=1000.0,
            cleaning_fee=0.0,
        )


# ─────────────────────────────────────────────────────────────────────────── #
# Overlap detection tests                                                      #
# ─────────────────────────────────────────────────────────────────────────── #

def _make_booking(db, listing, guest, check_in, check_out, status="confirmed"):
    from app.services.pricing_service import compute_price
    pricing = compute_price(check_in, check_out, 1000.0, 0.0)
    b = Booking(
        listing_id=listing.id,
        guest_id=guest.id,
        check_in=check_in,
        check_out=check_out,
        guests_adults=1,
        nightly_rate=pricing["nightly_rate"],
        cleaning_fee=pricing["cleaning_fee"],
        service_fee=pricing["service_fee"],
        total_price=pricing["total"],
        status=status,
    )
    db.add(b)
    db.commit()
    return b


def test_no_overlap_adjacent(db_session, seed_data):
    """Booking ending on Jan 10 does NOT conflict with booking starting Jan 10."""
    listing = seed_data["listing"]
    guest = seed_data["guest"]

    _make_booking(db_session, listing, guest, date(2027, 1, 5), date(2027, 1, 10))
    # New booking starts exactly when old one ends — should NOT overlap
    assert not check_overlap(db_session, listing.id, date(2027, 1, 10), date(2027, 1, 15))


def test_overlap_middle(db_session, seed_data):
    """A booking that overlaps in the middle should be detected."""
    listing = seed_data["listing"]
    guest = seed_data["guest"]

    _make_booking(db_session, listing, guest, date(2027, 2, 1), date(2027, 2, 10))
    assert check_overlap(db_session, listing.id, date(2027, 2, 5), date(2027, 2, 15))


def test_overlap_enclosing(db_session, seed_data):
    """New booking that completely encloses existing should be detected."""
    listing = seed_data["listing"]
    guest = seed_data["guest"]

    _make_booking(db_session, listing, guest, date(2027, 3, 5), date(2027, 3, 10))
    assert check_overlap(db_session, listing.id, date(2027, 3, 1), date(2027, 3, 20))


def test_cancelled_booking_not_overlapping(db_session, seed_data):
    """A cancelled booking should NOT block the dates."""
    listing = seed_data["listing"]
    guest = seed_data["guest"]

    _make_booking(db_session, listing, guest,
                  date(2027, 4, 1), date(2027, 4, 7), status="cancelled")
    assert not check_overlap(db_session, listing.id, date(2027, 4, 1), date(2027, 4, 7))


def test_create_booking_conflict(db_session, seed_data):
    """create_booking raises 409 on conflict."""
    from fastapi import HTTPException
    listing = seed_data["listing"]
    guest = seed_data["guest"]

    _make_booking(db_session, listing, guest, date(2027, 5, 1), date(2027, 5, 7))

    payload = BookingCreate(
        listing_id=listing.id,
        check_in=date(2027, 5, 3),
        check_out=date(2027, 5, 10),
        guests_adults=1,
    )
    with pytest.raises(HTTPException) as exc_info:
        create_booking(db_session, payload, guest)
    assert exc_info.value.status_code == 409


def test_create_booking_too_many_guests(db_session, seed_data):
    """create_booking raises 400 when guests exceed max_guests."""
    from fastapi import HTTPException
    listing = seed_data["listing"]
    guest = seed_data["guest"]

    # listing.max_guests == 4
    payload = BookingCreate(
        listing_id=listing.id,
        check_in=date(2027, 6, 1),
        check_out=date(2027, 6, 3),
        guests_adults=5,  # exceeds max_guests=4
    )
    with pytest.raises(HTTPException) as exc_info:
        create_booking(db_session, payload, guest)
    assert exc_info.value.status_code == 400
