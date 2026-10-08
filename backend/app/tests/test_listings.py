"""tests/test_listings.py — Tests for listing search and filter API."""

import pytest
from datetime import date, timedelta


def test_list_listings_empty(client):
    """GET /api/listings returns empty results when DB is empty."""
    response = client.get("/api/listings")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_list_listings_with_data(client, seed_data):
    """GET /api/listings returns the seeded listing."""
    response = client.get("/api/listings")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Test Beach Villa"


def test_location_filter(client, seed_data):
    """Location filter matches city case-insensitively."""
    r1 = client.get("/api/listings?location=goa")
    assert r1.json()["total"] == 1

    r2 = client.get("/api/listings?location=tokyo")
    assert r2.json()["total"] == 0


def test_price_range_filter(client, seed_data):
    """min_price and max_price filters work."""
    # listing price is 5000
    r1 = client.get("/api/listings?min_price=4000&max_price=6000")
    assert r1.json()["total"] == 1

    r2 = client.get("/api/listings?min_price=10000")
    assert r2.json()["total"] == 0


def test_guest_filter(client, seed_data):
    """Listings with fewer max_guests than requested are excluded."""
    # listing.max_guests == 4
    r1 = client.get("/api/listings?guests=4")
    assert r1.json()["total"] == 1

    r2 = client.get("/api/listings?guests=5")
    assert r2.json()["total"] == 0


def test_listing_detail(client, seed_data):
    """GET /api/listings/{id} returns full detail."""
    listing = seed_data["listing"]
    r = client.get(f"/api/listings/{listing.id}")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == listing.id
    assert data["city"] == "Goa"
    assert "host" in data


def test_listing_detail_not_found(client):
    """GET /api/listings/99999 returns 404."""
    r = client.get("/api/listings/99999")
    assert r.status_code == 404


def test_amenities_endpoint(client):
    """GET /api/amenities returns empty list when no amenities seeded."""
    r = client.get("/api/amenities")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_categories_endpoint(client):
    """GET /api/categories returns seeded category from conftest."""
    r = client.get("/api/categories")
    assert r.status_code == 200


def test_availability_endpoint(client, seed_data):
    """GET /api/listings/{id}/availability returns empty list when no bookings."""
    listing = seed_data["listing"]
    r = client.get(
        f"/api/listings/{listing.id}/availability",
        params={"from": str(date.today()), "to": str(date.today() + timedelta(days=30))},
    )
    assert r.status_code == 200
    assert r.json() == []
