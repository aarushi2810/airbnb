"use client";

/**
 * BookingCard.tsx
 *
 * Sticky reservation widget on listing detail page:
 *  - Displays nightly price, star rating, and review count.
 *  - Bordered input grid: CHECK-IN / CHECKOUT dates and GUESTS selector.
 *  - Guest stepper popover (Adults, Children, Infants) enforcing max_guests.
 *  - Real-time availability check & overlap prevention against blockedRanges.
 *  - Dynamic action button: "Check availability" -> "Reserve".
 *  - Live price breakdown calculation.
 *  - Seamless navigation to checkout flow (/book/[listingId]).
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, ChevronDown, Minus, Plus, AlertCircle } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { PriceBreakdown } from "./PriceBreakdown";
import { parseISO, differenceInCalendarDays, isBefore, isAfter } from "date-fns";
import type { ListingDetail, BookedDateRange } from "../../types";

interface BookingCardProps {
  listing: ListingDetail;
  isHostOwner?: boolean;
  blockedRanges: BookedDateRange[];
  checkIn: string | null;
  checkOut: string | null;
  onChangeDates?: (checkIn: string | null, checkOut: string | null) => void;
  guests: number;
  onChangeGuests: (guests: number) => void;
  onFocusCalendar?: () => void;
}

export function BookingCard({
  listing,
  isHostOwner = false,
  blockedRanges,
  checkIn,
  checkOut,
  onChangeDates: _onChangeDates,
  guests,
  onChangeGuests,
  onFocusCalendar,
}: BookingCardProps) {
  const router = useRouter();
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [adults, setAdults] = useState(Math.max(1, guests));
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const guestPickerRef = useRef<HTMLDivElement>(null);

  // Close guest picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (guestPickerRef.current && !guestPickerRef.current.contains(e.target as Node)) {
        setShowGuestPicker(false);
      }
    }
    if (showGuestPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGuestPicker]);

  // Sync total guests back to parent
  const totalGuests = adults + children;
  useEffect(() => {
    onChangeGuests(totalGuests);
  }, [totalGuests, onChangeGuests]);

  // Parse dates
  const checkInDate = checkIn ? parseISO(checkIn) : null;
  const checkOutDate = checkOut ? parseISO(checkOut) : null;

  const nights =
    checkInDate && checkOutDate
      ? differenceInCalendarDays(checkOutDate, checkInDate)
      : 0;

  // Validate date range against blocked ranges
  const overlapError = useMemo(() => {
    if (!checkInDate || !checkOutDate) return null;
    if (nights <= 0) return "Checkout date must be after check-in date";

    const hasOverlap = blockedRanges.some((range) => {
      const bStart = parseISO(range.check_in);
      const bEnd = parseISO(range.check_out);
      // Overlap condition: checkIn < bEnd AND checkOut > bStart
      return isBefore(checkInDate, bEnd) && isAfter(checkOutDate, bStart);
    });

    if (hasOverlap) {
      return "Selected dates include unavailable nights. Please choose other dates.";
    }
    return null;
  }, [checkInDate, checkOutDate, nights, blockedRanges]);

  const canReserve = Boolean(checkIn && checkOut && nights > 0 && !overlapError);

  const handleActionClick = () => {
    if (!canReserve) {
      if (onFocusCalendar) onFocusCalendar();
      return;
    }

    // Navigate to checkout page
    router.push(
      `/book/${listing.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${totalGuests}`
    );
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
      {/* Price & Rating Header */}
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
        <div>
          <span className="text-2xl font-bold text-[#222222]">
            {formatPrice(listing.price_per_night)}
          </span>
          <span className="text-sm font-normal text-neutral-500"> / night</span>
        </div>

        <div className="flex items-center gap-1 text-sm font-semibold text-[#222222]">
          <Star className="w-3.5 h-3.5 fill-[#222222] text-[#222222]" />
          <span>{listing.rating_avg ? listing.rating_avg.toFixed(2) : "New"}</span>
          <span className="text-neutral-400 font-normal">·</span>
          <span className="text-neutral-500 underline font-normal text-xs">
            {listing.review_count} reviews
          </span>
        </div>
      </div>

      {/* Input Grid (Check-in, Checkout, Guests) */}
      <div className="rounded-xl border border-neutral-400 mb-4 divide-y divide-neutral-400 overflow-hidden text-left">
        {/* Date Row */}
        <div
          onClick={onFocusCalendar}
          className="grid grid-cols-2 divide-x divide-neutral-400 cursor-pointer bg-white hover:bg-neutral-50 transition-colors"
        >
          <div className="p-3">
            <div className="text-[10px] font-extrabold uppercase text-[#222222] tracking-wider">
              CHECK-IN
            </div>
            <div className="text-xs text-[#222222] font-medium mt-0.5 truncate">
              {checkIn || "Add date"}
            </div>
          </div>
          <div className="p-3">
            <div className="text-[10px] font-extrabold uppercase text-[#222222] tracking-wider">
              CHECKOUT
            </div>
            <div className="text-xs text-[#222222] font-medium mt-0.5 truncate">
              {checkOut || "Add date"}
            </div>
          </div>
        </div>

        {/* Guests Row */}
        <div className="relative" ref={guestPickerRef}>
          <button
            type="button"
            onClick={() => setShowGuestPicker((prev) => !prev)}
            className="w-full p-3 flex items-center justify-between bg-white hover:bg-neutral-50 transition-colors text-left"
          >
            <div>
              <div className="text-[10px] font-extrabold uppercase text-[#222222] tracking-wider">
                GUESTS
              </div>
              <div className="text-xs text-[#222222] font-medium mt-0.5">
                {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
                {infants > 0 ? `, ${infants} infant${infants !== 1 ? "s" : ""}` : ""}
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-neutral-600 transition-transform ${
                showGuestPicker ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Guest Stepper Dropdown */}
          {showGuestPicker && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl p-4 space-y-4 animate-in fade-in duration-150">
              {/* Adults */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#222222]">Adults</div>
                  <div className="text-xs text-neutral-500">Age 13+</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={adults <= 1}
                    onClick={() => setAdults((a) => Math.max(1, a - 1))}
                    className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-black disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">{adults}</span>
                  <button
                    type="button"
                    disabled={totalGuests >= listing.max_guests}
                    onClick={() => setAdults((a) => a + 1)}
                    className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-black disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#222222]">Children</div>
                  <div className="text-xs text-neutral-500">Ages 2–12</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={children <= 0}
                    onClick={() => setChildren((c) => Math.max(0, c - 1))}
                    className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-black disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">{children}</span>
                  <button
                    type="button"
                    disabled={totalGuests >= listing.max_guests}
                    onClick={() => setChildren((c) => c + 1)}
                    className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-black disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Infants */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#222222]">Infants</div>
                  <div className="text-xs text-neutral-500">Under 2</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={infants <= 0}
                    onClick={() => setInfants((inf) => Math.max(0, inf - 1))}
                    className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-black disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">{infants}</span>
                  <button
                    type="button"
                    disabled={infants >= 5}
                    onClick={() => setInfants((inf) => inf + 1)}
                    className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-black disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Helper text */}
              <p className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
                This place has a maximum of {listing.max_guests} guests, not including infants.
              </p>

              <button
                type="button"
                onClick={() => setShowGuestPicker(false)}
                className="w-full py-2 bg-[#222222] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {overlapError && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{overlapError}</span>
        </div>
      )}

      {/* Action Button or Host Banner */}
      {isHostOwner ? (
        <div className="space-y-2">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-900 font-semibold">
            This is your listing
          </div>
          <Link
            href={`/host/listings/${listing.id}/edit`}
            className="block w-full text-center py-3 rounded-xl bg-[#222222] text-white font-semibold text-xs hover:bg-black transition-colors"
          >
            Edit listing details
          </Link>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={handleActionClick}
            className={`w-full py-3.5 rounded-xl font-semibold text-white shadow-md transition-all duration-200 ${
              canReserve
                ? "bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:opacity-95 active:scale-[0.99]"
                : "bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:opacity-95"
            }`}
          >
            {canReserve ? "Reserve" : "Check availability"}
          </button>

          {/* Reassurance text */}
          <p className="text-center text-xs text-neutral-500 mt-3 font-normal">
            You won&apos;t be charged yet
          </p>
        </>
      )}

      {/* Price breakdown */}
      {canReserve && (
        <PriceBreakdown
          nightlyRate={listing.price_per_night}
          nights={nights}
          cleaningFee={listing.cleaning_fee}
        />
      )}
    </div>
  );
}
