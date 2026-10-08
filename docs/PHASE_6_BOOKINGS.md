# Phase 6: Booking Flow, Confirmation, My Trips, Wishlists & Reviews

This document details the architecture, state management, components, and transactional guarantees implemented in **Phase 6: Booking Flow, Confirmation, My Trips, Wishlists & Reviews**.

---

## 1. Overview & Workflows

Phase 6 completes the entire guest reservation lifecycle, connecting the checkout page (`/book/[listingId]`), instant conflict prevention, trip confirmation (`/trips/[bookingId]?confirmed=1`), reservation management (`/trips`), wishlist persistence (`/wishlists`), and review submission (`ReviewModal`).

```
                    ┌────────────────────────┐
                    │ Listing Detail Page    │
                    │ (/listings/[id])       │
                    └───────────┬────────────┘
                                │ Clicks "Reserve"
                                ▼
                    ┌────────────────────────┐
                    │ Request to Book        │
                    │ (/book/[listingId])    │
                    └───────────┬────────────┘
                                │ Submits with card simulation
                                │ (POST /api/bookings)
                     ┌──────────┴──────────┐
                     │                     │
                     ▼                     ▼
          [ 409 DATE_CONFLICT ]      [ 201 Created ]
          Inline error banner        Redirects to confirmation
          Toast & "Change dates"     (/trips/[bookingId]?confirmed=1)
                     │                     │
                     │                     ▼
                     │               ┌───────────────────┐
                     └──────────────►│ Trips Dashboard   │
                                     │ (/trips)          │
                                     └─────────┬─────────┘
                                               │
                         ┌─────────────────────┴─────────────────────┐
                         ▼                                           ▼
               [ Cancel Booking ]                           [ Leave a Review ]
            Moves trip to Cancelled                     Interactive star ratings
            Dates immediately reopened                  Aggregates recomputed live
```

---

## 2. Key Pages & Components

### 2.1 Request to Book Checkout ([`/book/[listingId]/page.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/app/book/%5BlistingId%5D/page.tsx))
- **Two-Column Layout**:
  - **Left**:
    - **Your Trip**: Interactive Dates and Guests rows with underlined `"Edit"` buttons opening modal selectors to adjust dates and guest counts with real-time availability re-validation.
    - **Pay with Form**: Mocked credit card form with auto-spacing mask (`4532 0123 4567 8910`), live card brand detection (*Visa*, *Mastercard*, *Amex*), expiration mask (`MM/YY`), CVV, ZIP code, and country selector. Validated completely client-side; no sensitive data is stored or transmitted.
    - **Dynamic Cancellation Policy**: Computes and formats the exact date and time 48 hours prior to check-in (e.g., `"Free cancellation before Oct 16, 2026 at 3:00 PM"`).
    - **Ground Rules**: Clear community guidelines for guests.
    - **Action Button**: `"Confirm and pay"` with double-submit prevention and loading spinner.
  - **Right**:
    - **Sticky Summary Card**: Listing thumbnail, title, property type, star rating & review count, AirCover trust badge, and itemized `PriceBreakdown` fetched from `POST /api/bookings/price`.
- **Conflict Handling (409)**:
  - If another guest reserves overlapping dates, the API returns HTTP 409 `DATE_CONFLICT`.
  - The UI presents an inline banner (*"These dates just became unavailable"*), shows a toast, refetches availability, and provides a `"Change dates"` trigger.

### 2.2 Trip Confirmation View ([`/trips/[bookingId]/page.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/app/trips/%5BbookingId%5D/page.tsx))
- **Confirmation Banner**: Green gradient celebration header with checkmark when `?confirmed=1`.
- **Copyable Booking Code**: Interactive chip displaying the reservation code (e.g. `HME74E94`) with one-click clipboard copying and toast confirmation.
- **Trip Summary**: Check-in/checkout dates & times (3:00 PM check-in, 11:00 AM checkout), guest counts, listing photo, and total price paid.
- **Navigation Actions**: Direct links to `"View my trips"` and `"Keep exploring"`.

### 2.3 My Trips Dashboard ([`/trips/page.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/app/trips/page.tsx))
- **Categorized Tabs**: `Upcoming`, `Past stays`, and `Cancelled` with live count badges.
- **Trip Cards**: Cover photo, title, location, date span, duration, guest count, total price paid, and status badge.
- **Cancellation Workflow**: For upcoming trips, `"Cancel booking"` opens a modal explaining the cancellation policy. On confirmation (`POST /api/bookings/{id}/cancel`), the trip transitions to `Cancelled` and the dates reopen immediately.
- **Review Workflow**: For completed/past stays, `"Leave a review"` opens the `ReviewModal`.

### 2.4 Review Modal ([`ReviewModal.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/components/booking/ReviewModal.tsx))
- **Interactive Ratings**:
  - Overall 5-star rating with hover preview.
  - 6 individual category star rows (*Cleanliness*, *Accuracy*, *Communication*, *Location*, *Check-in*, *Value*).
  - Comment textarea requiring at least 10 characters with live character counter.
- **Backend Sync**: Dispatches to `POST /api/listings/{listingId}/reviews`, atomically updating the listing's average rating and review count.

### 2.5 Wishlists ([`/wishlists/page.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/app/wishlists/page.tsx))
- Reusable listing grid displaying all saved stays.
- Optimistic heart toggling with smooth CSS fade-out animation upon un-hearting.
- Logged-out state with clear call to action opening the mock identity modal.

### 2.6 Route Authentication Guard ([`useRequireAuth.ts`](file:///Users/aarushi/Documents/airbnb/frontend/src/hooks/useRequireAuth.ts))
- Protects booking checkout, trip history, and wishlists.
- If unauthenticated, automatically triggers the login modal.
- Permits host accounts to book stays seamlessly.

---

## 3. End-to-End Verification Test Log

The entire lifecycle was validated against the running backend server:

| Step | Operation | Result | Status |
|---|---|---|---|
| **1** | Check Listing #23 initial availability (`2026-12-01` to `2026-12-31`) | `[]` (All dates free) | ✅ Verified |
| **2** | Server price quote for `2026-12-05` to `2026-12-09` (4 nights @ ₹4,200) | Subtotal: ₹16,800, Cleaning: ₹700, Service: ₹2,352, Total: ₹19,852 | ✅ Verified |
| **3** | User 4 reserves Listing #23 | HTTP 201 Created, Booking ID 21, Code `HME74E94` | ✅ Verified |
| **4** | Check Listing #23 availability after booking | `[{'check_in': '2026-12-05', 'check_out': '2026-12-09'}]` | ✅ Verified |
| **5** | User 5 attempts to book the same dates | **HTTP 409 Conflict** (`DATE_CONFLICT`) | ✅ Verified |
| **6** | User 4 checks `GET /api/bookings/my` | Found booking `HME74E94` with status `confirmed` | ✅ Verified |
| **7** | User 4 cancels booking 21 (`POST /api/bookings/21/cancel`) | HTTP 200 OK, status updated to `cancelled` | ✅ Verified |
| **8** | Check Listing #23 availability after cancellation | `[]` (Dates immediately reopened) | ✅ Verified |
| **9** | User 4 leaves 5-star review for Listing #23 | HTTP 201 Created, review count updated to 1, aggregates updated | ✅ Verified |
| **10** | TypeScript & ESLint audit | `npm run lint` & `npm run build` pass with 0 errors & 0 warnings | ✅ Verified |
