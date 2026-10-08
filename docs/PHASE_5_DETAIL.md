# Phase 5: Listing Detail Page & Availability Architecture

This document provides a comprehensive, line-by-line breakdown of all components and logic implemented in **Phase 5: Listing Detail Page (`/listings/[id]`)**.

---

## 1. Overview & Architecture

Phase 5 delivers a pixel-faithful recreation of Airbnb's desktop and mobile listing detail experience. It connects the Next.js App Router dynamic route (`/listings/[id]`) with three FastAPI backend endpoints:
1. `GET /api/listings/{id}` — Full listing metadata, host details, amenities list, and photos.
2. `GET /api/listings/{id}/availability?from=...&to=...` — Blocked / booked date intervals from SQLite.
3. `GET /api/listings/{id}/reviews?page=1` — Guest reviews with category breakdown scores.

```
                      ┌────────────────────────────────────────┐
                      │    ListingDetailPage (/listings/[id])   │
                      └──────────────────┬─────────────────────┘
                                         │
        ┌────────────────────────────────┼──────────────────────────────┐
        ▼                                ▼                              ▼
┌──────────────┐             ┌──────────────────────┐         ┌───────────────────┐
│ PhotoGallery │             │   Listing Content    │         │    BookingCard    │
│  - 5-mosaic  │             │  - Summary & Host    │         │  - Sticky card    │
│  - Modal     │             │  - 3 Highlights      │         │  - Date & Guests  │
│  - Carousel  │             │  - Description       │         │  - Conflict check │
└──────────────┘             │  - Bed sleeping arr. │         │  - PriceBreakdown │
                             │  - AmenitiesList     │         │  - Reserve action │
                             │  - AvailabilityCal   │         └───────────────────┘
                             │  - ReviewsSection    │
                             │  - Map preview       │
                             │  - HostCard profile  │
                             │  - Things to know    │
                             └──────────────────────┘
```

---

## 2. Key Components Built

### 2.1 `PhotoGallery` ([`PhotoGallery.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/components/listings/PhotoGallery.tsx))
- **Desktop (lg+)**: 5-photo mosaic grid.
  - Large hero image spanning 2 columns and 2 rows on the left.
  - 4 smaller images in a 2x2 grid on the right.
  - Hover brightness transition and rounded border radiuses.
  - "Show all N photos" pill button bottom-right with grid icon.
- **Mobile (< lg)**: Single-photo carousel with swipe navigation and counter badge (e.g. `1 / 5`).
- **Fullscreen Modal Gallery**: Clean vertical-scrolling feed of all high-resolution images with sticky close button, Share, and Save triggers.

### 2.2 `AvailabilityCalendar` ([`AvailabilityCalendar.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/components/listings/AvailabilityCalendar.tsx))
- **Dual-Month View**: Renders current and next month side-by-side (1 month on mobile).
- **Blocked Date Enforcement**: Dates prior to today and dates falling within `blockedRanges` are greyed out, struck through, and unclickable (`pointer-events-none`).
- **Interval Validation**: When selecting a check-out date, validates that the interval $[checkIn, checkOut]$ does not span any blocked dates:
  $$\text{Overlap} \iff \exists\, \text{range} : checkIn < range.end \land checkOut > range.start$$
- **Two-Way Synchronization**: Synchronizes seamlessly with the sticky `BookingCard` date inputs.

### 2.3 `BookingCard` ([`BookingCard.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/components/booking/BookingCard.tsx))
- **Sticky Desktop Card**: Fixed position on desktop (`sticky top-28`).
- **Input Table**: 2x2 bordered grid:
  - Top row: `CHECK-IN` and `CHECKOUT`. Clicking automatically scrolls to or highlights the calendar.
  - Bottom row: `GUESTS`. Clicking opens a stepper popover for Adults, Children, and Infants, enforcing $adults + children \le listing.max\_guests$.
- **Dynamic Action Button**:
  - Displays `"Check availability"` when dates are unselected.
  - Displays `"Reserve"` (Airbnb red gradient) when dates are valid.
  - Disables action and displays inline alert if selected range overlaps an existing booking.
- **Routing**: Clicking Reserve navigates to `/book/[id]?checkIn=...&checkOut=...&guests=...`.

### 2.4 `PriceBreakdown` ([`PriceBreakdown.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/components/booking/PriceBreakdown.tsx))
- Implements the exact pricing formula matching `app.services.pricing_service`:
  $$\text{subtotal} = \text{nightly\_rate} \times \text{nights}$$
  $$\text{service\_fee} = \text{round}(\text{subtotal} \times 0.14)$$
  $$\text{total} = \text{subtotal} + \text{cleaning\_fee} + \text{service\_fee}$$
- Underlined labels with tooltips explaining fees.

### 2.5 `AmenitiesList` ([`AmenitiesList.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/components/listings/AmenitiesList.tsx))
- 2-column preview grid of top 10 amenities with matching Lucide vector icons (`Wifi`, `Utensils`, `Wind`, `Flame`, `Waves`, `Car`, `Tv`, `Bath`, `Dumbbell`, `Snowflake`, `Zap`, `Monitor`, `Bell`, `Heart`, etc.).
- "Show all N amenities" button opening a modal grouping all amenities by category (`Internet & office`, `Kitchen`, `Bathroom`, `Safety`, `Outdoors`, etc.).

### 2.6 `ReviewsSection` ([`ReviewsSection.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/components/listings/ReviewsSection.tsx))
- "Guest favourite" badge banner for top-rated listings.
- 6 category rating breakdown progress bars (Cleanliness, Accuracy, Communication, Location, Check-in, Value).
- 2-column grid of review cards with author avatars, ratings, and expandable text ("Show more").
- "Show all N reviews" modal with full review feed.

### 2.7 `HostCard` ([`HostCard.tsx`](file:///Users/aarushi/Documents/airbnb/frontend/src/components/listings/HostCard.tsx))
- Host profile card with avatar, Superhost status, review count, rating, and years hosting.
- Response rate (98%) and response time ("within an hour").
- Host bio and disabled "Message Host" button opening Coming Soon modal.
- Airbnb AirCover safety and payment guarantee note.

---

## 3. Validation Logic Summary

| Validation Rule | Condition | User Feedback |
|---|---|---|
| **Past Dates** | $date < today$ | Disabled & struck through on calendar |
| **Booked Nights** | $date \in [blocked.start, blocked.end]$ | Disabled, line-through styling |
| **Range Overlap** | $checkIn < blocked.end \land checkOut > blocked.start$ | Resets check-in or displays inline red error: *"Selected dates include unavailable nights"* |
| **Minimum Nights** | $nights < 1$ | Subtitle displays *"Minimum stay: 1 night"* |
| **Guest Limit** | $adults + children > max\_guests$ | Plus button disabled in guest stepper; helper note displayed |
| **Unselected Dates** | $checkIn = null \lor checkOut = null$ | Button displays *"Check availability"*; clicks focus calendar |
| **Valid Selection** | Valid dates + guest count within limit | Button displays *"Reserve"*; live `PriceBreakdown` rendered |

---

## 4. Verification & Testing

- **Listing #11 Test**: Verified that confirmed seeded bookings (`2026-10-13` to `2026-10-17`) are disabled on the calendar.
- **Price Calculation Test**: Selected `2026-10-18` to `2026-10-22` (4 nights at ₹6,500/night):
  - Base subtotal: ₹26,000
  - Cleaning fee: ₹900
  - Service fee: ₹3,640
  - Total before taxes: ₹30,540
- **TypeScript & Lint**: `npm run build` and `npm run lint` pass with 0 errors.
