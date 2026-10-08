"""services/pricing_service.py — Pure pricing calculations.

Server-side pricing ensures the client cannot tamper with amounts.
Formula:
  subtotal    = nights × nightly_rate
  service_fee = round(subtotal × 0.14, 2)   (Airbnb-style ~14%)
  total       = subtotal + cleaning_fee + service_fee
"""

from math import ceil
from datetime import date


SERVICE_FEE_RATE = 0.14  # 14 % of accommodation subtotal


def compute_price(
    check_in: date,
    check_out: date,
    nightly_rate: float,
    cleaning_fee: float,
) -> dict:
    """
    Returns a dict with full price breakdown.
    All monetary values are rounded to 2 decimal places.
    """
    nights = (check_out - check_in).days
    if nights <= 0:
        raise ValueError("check_out must be after check_in")

    subtotal = round(nights * nightly_rate, 2)
    service_fee = round(subtotal * SERVICE_FEE_RATE, 2)
    total = round(subtotal + cleaning_fee + service_fee, 2)

    return {
        "nights": nights,
        "nightly_rate": nightly_rate,
        "subtotal": subtotal,
        "cleaning_fee": cleaning_fee,
        "service_fee": service_fee,
        "total": total,
    }
