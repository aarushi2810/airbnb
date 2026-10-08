"use client";

/**
 * /book/[listingId]/page.tsx
 *
 * Airbnb "Request to book" checkout page:
 *  - Two-column layout (Left: Trip details, Pay with form, Policy; Right: Sticky summary & PriceBreakdown).
 *  - URL param validation (checkIn, checkOut, guests) with redirect fallback.
 *  - Protected route via useRequireAuth.
 *  - Editable Dates and Guests modals with availability re-validation.
 *  - Mocked credit card payment form with spacing mask, brand detection, and client-side validation.
 *  - Dynamic cancellation policy computed 48 hours prior to check-in.
 *  - Atomic booking submission via POST /api/bookings with 409 conflict handling.
 *  - Navigation to confirmation view /trips/[bookingId]?confirmed=1 upon success.
 */

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Container } from "../../../components/layout/Container";
import { PriceBreakdown } from "../../../components/booking/PriceBreakdown";
import { Modal } from "../../../components/ui/Modal";
import { Stepper } from "../../../components/ui/Stepper";
import { api, ApiError } from "../../../lib/api";
import { useAuth } from "../../../hooks/useAuth";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { toast } from "sonner";
import {
  ChevronLeft,
  Star,
  ShieldCheck,
  CreditCard,
  Lock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  parseISO,
  format,
  subHours,
  differenceInCalendarDays,
  isBefore,
  isAfter,
  startOfToday,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import type {
  ListingDetail,
  BookedDateRange,
  PriceBreakdown as PriceBreakdownType,
} from "../../../types";

export default function BookingCheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const listingId = Number(params?.listingId);
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const guestsParam = searchParams.get("guests");

  const { currentUser, openLoginModal } = useAuth();
  useRequireAuth({ triggerModal: true });

  // Listing and availability state
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [blockedRanges, setBlockedRanges] = useState<BookedDateRange[]>([]);
  const [isLoadingListing, setIsLoadingListing] = useState(true);

  // Active reservation parameters
  const [checkIn, setCheckIn] = useState<string>(checkInParam || "");
  const [checkOut, setCheckOut] = useState<string>(checkOutParam || "");
  const [guestsCount, setGuestsCount] = useState<number>(
    guestsParam ? Math.max(1, parseInt(guestsParam, 10)) : 1
  );

  // Price quote
  const [priceQuote, setPriceQuote] = useState<PriceBreakdownType | null>(null);
  const [isQuotingPrice, setIsQuotingPrice] = useState(false);

  // Edit Modals
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [isEditingGuests, setIsEditingGuests] = useState(false);

  // Date selection scratch state for modal
  const [tempCheckIn, setTempCheckIn] = useState<string | null>(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<string | null>(checkOut);
  const [calendarMonth, _setCalendarMonth] = useState<Date>(new Date());

  // Guest edit scratch state
  const [tempAdults, setTempAdults] = useState(Math.max(1, guestsCount));
  const [tempChildren, setTempChildren] = useState(0);

  // Mock Payment Form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("United States");
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDateConflict, setIsDateConflict] = useState(false);

  // Redirect if missing essential parameters
  useEffect(() => {
    if (!listingId || isNaN(listingId)) {
      router.push("/");
      return;
    }
    if (!checkInParam || !checkOutParam) {
      router.push(`/listings/${listingId}`);
    }
  }, [listingId, checkInParam, checkOutParam, router]);

  // Load listing & availability
  useEffect(() => {
    if (!listingId || isNaN(listingId)) return;
    let isMounted = true;
    setIsLoadingListing(true);

    Promise.all([
      api.listings.getById(listingId),
      api.listings.getAvailability(listingId).catch(() => [] as BookedDateRange[]),
    ])
      .then(([listingData, availabilityData]) => {
        if (!isMounted) return;
        setListing(listingData);
        setBlockedRanges(availabilityData);
      })
      .catch((_err) => {
        if (!isMounted) return;
        toast.error("Failed to load listing information");
      })
      .finally(() => {
        if (isMounted) setIsLoadingListing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [listingId]);

  // Fetch or calculate price breakdown whenever dates change
  useEffect(() => {
    if (!listingId || !checkIn || !checkOut || !listing) return;

    let isMounted = true;
    setIsQuotingPrice(true);

    api.bookings
      .quotePrice({
        listing_id: listingId,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guestsCount,
      })
      .then((quote) => {
        if (!isMounted) return;
        setPriceQuote(quote);
      })
      .catch(() => {
        if (!isMounted) return;
        // Client-side fallback calculation matching backend
        const inDate = parseISO(checkIn);
        const outDate = parseISO(checkOut);
        const nights = Math.max(1, differenceInCalendarDays(outDate, inDate));
        const subtotal = Math.round(nights * listing.price_per_night);
        const serviceFee = Math.round(subtotal * 0.14);
        const total = subtotal + listing.cleaning_fee + serviceFee;
        setPriceQuote({
          nights,
          nightly_rate: listing.price_per_night,
          subtotal,
          cleaning_fee: listing.cleaning_fee,
          service_fee: serviceFee,
          total,
        });
      })
      .finally(() => {
        if (isMounted) setIsQuotingPrice(false);
      });

    return () => {
      isMounted = false;
    };
  }, [listingId, checkIn, checkOut, guestsCount, listing]);

  // Sync state to URL params
  const updateUrlParams = (newCheckIn: string, newCheckOut: string, newGuests: number) => {
    const p = new URLSearchParams();
    p.set("checkIn", newCheckIn);
    p.set("checkOut", newCheckOut);
    p.set("guests", newGuests.toString());
    router.replace(`/book/${listingId}?${p.toString()}`);
  };

  // ── Card Input Formatters ──────────────────────────────────────────────────
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    // Add space every 4 digits
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
    if (cardErrors.number) setCardErrors((prev) => ({ ...prev, number: "" }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setExpiry(raw);
    if (cardErrors.expiry) setCardErrors((prev) => ({ ...prev, expiry: "" }));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvv(raw);
    if (cardErrors.cvv) setCardErrors((prev) => ({ ...prev, cvv: "" }));
  };

  // Card brand detection
  const cardBrand = useMemo(() => {
    const num = cardNumber.replace(/\s/g, "");
    if (num.startsWith("4")) return "Visa";
    if (num.startsWith("5") || num.startsWith("2")) return "Mastercard";
    if (num.startsWith("34") || num.startsWith("37")) return "Amex";
    return null;
  }, [cardNumber]);

  // Validation
  const validatePayment = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanNum = cardNumber.replace(/\s/g, "");

    if (cleanNum.length < 15) {
      errors.number = "Enter a valid 16-digit card number";
    }

    if (expiry.length < 5) {
      errors.expiry = "Enter MM/YY";
    } else {
      const [m, _y] = expiry.split("/").map(Number);
      if (m < 1 || m > 12) {
        errors.expiry = "Invalid month";
      }
    }

    if (cvv.length < 3) {
      errors.cvv = "Enter 3 or 4 digits";
    }

    if (!zip.trim()) {
      errors.zip = "Postal code required";
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Date Overlap Check for Modal Calendar ──────────────────────────────────
  const isDateBlocked = (date: Date): boolean => {
    const today = startOfToday();
    if (isBefore(date, today)) return true;
    return blockedRanges.some((range) => {
      const start = parseISO(range.check_in);
      const end = parseISO(range.check_out);
      return isAfter(date, start) && isBefore(date, end);
    });
  };

  const hasRangeOverlap = (start: Date, end: Date): boolean => {
    return blockedRanges.some((range) => {
      const bStart = parseISO(range.check_in);
      const bEnd = parseISO(range.check_out);
      return isBefore(start, bEnd) && isAfter(end, bStart);
    });
  };

  const handleModalDateClick = (day: Date) => {
    if (isDateBlocked(day)) return;
    const formatted = format(day, "yyyy-MM-dd");

    if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
      setTempCheckIn(formatted);
      setTempCheckOut(null);
      return;
    }

    const start = parseISO(tempCheckIn);
    if (isBefore(day, start) || isSameDay(day, start)) {
      setTempCheckIn(formatted);
      setTempCheckOut(null);
      return;
    }

    if (hasRangeOverlap(start, day)) {
      toast.error("Selected dates include unavailable nights");
      setTempCheckIn(formatted);
      setTempCheckOut(null);
      return;
    }

    setTempCheckOut(formatted);
  };

  const handleSaveDates = () => {
    if (!tempCheckIn || !tempCheckOut) {
      toast.error("Please select both check-in and checkout dates");
      return;
    }
    setCheckIn(tempCheckIn);
    setCheckOut(tempCheckOut);
    setIsDateConflict(false);
    setSubmitError(null);
    updateUrlParams(tempCheckIn, tempCheckOut, guestsCount);
    setIsEditingDates(false);
    toast.success("Dates updated");
  };

  const handleSaveGuests = () => {
    const total = tempAdults + tempChildren;
    setGuestsCount(total);
    updateUrlParams(checkIn, checkOut, total);
    setIsEditingGuests(false);
  };

  // ── Submit Booking ─────────────────────────────────────────────────────────
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!currentUser) {
      openLoginModal();
      return;
    }

    if (!validatePayment()) {
      toast.error("Please correct payment details to proceed");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setIsDateConflict(false);

    try {
      const response = await api.bookings.create({
        listing_id: listingId,
        check_in: checkIn,
        check_out: checkOut,
        guests_adults: guestsCount,
        guests_children: 0,
        guests_infants: 0,
      });

      toast.success("Reservation confirmed!");
      // Route to confirmation view
      router.push(`/trips/${response.booking.id}?confirmed=1`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setIsDateConflict(true);
          setSubmitError(
            "These dates just became unavailable. Another guest may have just reserved them."
          );
          toast.error("Dates unavailable: conflict detected.");
          // Refresh availability in background
          api.listings
            .getAvailability(listingId)
            .then(setBlockedRanges)
            .catch(() => {});
        } else {
          setSubmitError(err.detail || "Unable to complete reservation. Please try again.");
          toast.error(err.detail || "Booking failed");
        }
      } else {
        setSubmitError("Network error. Please verify your connection.");
        toast.error("Network error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute cancellation threshold (48 hours before check-in)
  const cancellationDeadline = useMemo(() => {
    if (!checkIn) return "48 hours before check-in";
    try {
      const checkInDate = parseISO(checkIn);
      const deadline = subHours(checkInDate, 48);
      return format(deadline, "MMM d, yyyy 'at' 3:00 PM");
    } catch {
      return "48 hours before check-in";
    }
  }, [checkIn]);

  // Loading skeleton
  if (isLoadingListing || !listing) {
    return (
      <div className="py-12 animate-pulse">
        <Container>
          <div className="h-8 w-60 bg-neutral-200 rounded mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7 space-y-6">
              <div className="h-32 bg-neutral-100 rounded-2xl" />
              <div className="h-48 bg-neutral-100 rounded-2xl" />
            </div>
            <div className="lg:col-span-5">
              <div className="h-72 bg-neutral-200 rounded-2xl" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const inDate = checkIn ? parseISO(checkIn) : null;
  const outDate = checkOut ? parseISO(checkOut) : null;
  const nights = inDate && outDate ? differenceInCalendarDays(outDate, inDate) : 0;

  return (
    <div className="py-8 sm:py-12 min-h-screen bg-white">
      <Container>
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/listings/${listingId}`}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-800"
            aria-label="Back to listing"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">
            Request to book
          </h1>
        </div>

        {/* ── Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">
          {/* ── Left Column: Checkout Details & Payment ── */}
          <div className="lg:col-span-7 space-y-8">
            {/* Your Trip Section */}
            <div className="border-b border-neutral-200 pb-8 space-y-6">
              <h2 className="text-xl font-bold text-[#222222]">Your trip</h2>

              {/* Dates Row */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base text-[#222222]">Dates</h3>
                  <p className="text-sm text-neutral-600 mt-0.5">
                    {inDate && outDate
                      ? `${format(inDate, "MMM d")} – ${format(outDate, "MMM d, yyyy")} (${nights} night${nights !== 1 ? "s" : ""})`
                      : "Add dates"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempCheckIn(checkIn);
                    setTempCheckOut(checkOut);
                    setIsEditingDates(true);
                  }}
                  className="font-semibold text-sm underline text-[#222222] hover:text-black py-1"
                >
                  Edit
                </button>
              </div>

              {/* Guests Row */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base text-[#222222]">Guests</h3>
                  <p className="text-sm text-neutral-600 mt-0.5">
                    {guestsCount} guest{guestsCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempAdults(guestsCount);
                    setTempChildren(0);
                    setIsEditingGuests(true);
                  }}
                  className="font-semibold text-sm underline text-[#222222] hover:text-black py-1"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Pay With Form */}
            <div className="border-b border-neutral-200 pb-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#222222]">Pay with</h2>
                <div className="flex items-center gap-2 text-neutral-500">
                  <CreditCard className="w-5 h-5 text-neutral-700" />
                  <span className="text-xs font-semibold">{cardBrand || "Credit Card"}</span>
                </div>
              </div>

              {/* Mock Card Form */}
              <div className="rounded-2xl border border-neutral-300 divide-y divide-neutral-300 overflow-hidden bg-white shadow-sm">
                {/* Card Number */}
                <div className="p-3.5 relative">
                  <label className="block text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider">
                    Card Number
                  </label>
                  <div className="flex items-center justify-between mt-1">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4532 0123 4567 8910"
                      className="w-full text-sm font-mono text-[#222222] placeholder:text-neutral-400 focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
                  </div>
                  {cardErrors.number && (
                    <p className="text-xs text-rose-600 mt-1">{cardErrors.number}</p>
                  )}
                </div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-2 divide-x divide-neutral-300">
                  <div className="p-3.5">
                    <label className="block text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider">
                      Expiration
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full text-sm font-mono text-[#222222] placeholder:text-neutral-400 focus:outline-none mt-1"
                    />
                    {cardErrors.expiry && (
                      <p className="text-xs text-rose-600 mt-1">{cardErrors.expiry}</p>
                    )}
                  </div>
                  <div className="p-3.5">
                    <label className="block text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={handleCvvChange}
                      placeholder="123"
                      className="w-full text-sm font-mono text-[#222222] placeholder:text-neutral-400 focus:outline-none mt-1"
                    />
                    {cardErrors.cvv && (
                      <p className="text-xs text-rose-600 mt-1">{cardErrors.cvv}</p>
                    )}
                  </div>
                </div>

                {/* Postal Code & Country */}
                <div className="grid grid-cols-2 divide-x divide-neutral-300">
                  <div className="p-3.5">
                    <label className="block text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider">
                      ZIP / Postal code
                    </label>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="10001"
                      className="w-full text-sm text-[#222222] placeholder:text-neutral-400 focus:outline-none mt-1"
                    />
                    {cardErrors.zip && (
                      <p className="text-xs text-rose-600 mt-1">{cardErrors.zip}</p>
                    )}
                  </div>
                  <div className="p-3.5">
                    <label className="block text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider">
                      Country / Region
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full text-sm text-[#222222] bg-transparent focus:outline-none mt-1"
                    >
                      <option>United States</option>
                      <option>India</option>
                      <option>United Kingdom</option>
                      <option>France</option>
                      <option>Canada</option>
                      <option>Australia</option>
                    </select>
                  </div>
                </div>
              </div>

              <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Encrypted simulation &bull; No card data is stored or charged.</span>
              </p>
            </div>

            {/* Cancellation Policy */}
            <div className="border-b border-neutral-200 pb-8 space-y-3">
              <h2 className="text-xl font-bold text-[#222222]">Cancellation policy</h2>
              <p className="text-sm text-neutral-700 leading-relaxed">
                <strong className="text-[#222222]">Free cancellation before {cancellationDeadline}.</strong>{" "}
                Cancel before check-in for a partial refund. Review the host&apos;s full policy for details.
              </p>
            </div>

            {/* Ground Rules */}
            <div className="border-b border-neutral-200 pb-8 space-y-3">
              <h2 className="text-xl font-bold text-[#222222]">Ground rules</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                We ask every guest to remember a few simple things about what makes a great guest:
              </p>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                <li>Follow the house rules</li>
                <li>Treat your Host&apos;s home like your own</li>
              </ul>
            </div>

            {/* Conflict or Submission Error Banner */}
            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <h4 className="font-semibold text-sm">
                      {isDateConflict ? "Dates Unavailable" : "Unable to reserve"}
                    </h4>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      {submitError}
                    </p>
                  </div>
                </div>
                {isDateConflict && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempCheckIn(null);
                      setTempCheckOut(null);
                      setIsEditingDates(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#222222] text-white text-xs font-semibold hover:bg-black transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Change dates
                  </button>
                )}
              </div>
            )}

            {/* Confirm & Pay Button */}
            <div className="space-y-4">
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                By selecting the button below, I agree to the Host&apos;s House Rules, Ground Rules for
                Guests, and Airbnb&apos;s Rebooking and Refund Policy.
              </p>

              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={isSubmitting || !checkIn || !checkOut}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white font-bold text-base shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing reservation...</span>
                  </>
                ) : (
                  <span>Confirm and pay</span>
                )}
              </button>
            </div>
          </div>

          {/* ── Right Column: Sticky Summary Card ── */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm space-y-6">
              {/* Listing Thumbnail & Meta */}
              <div className="flex gap-4">
                <div className="relative w-28 h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                  <Image
                    src={
                      listing.images[0]?.url ||
                      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600"
                    }
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-neutral-500 block truncate">
                    Entire {listing.property_type || "home"} in {listing.city}
                  </span>
                  <h3 className="font-semibold text-sm text-[#222222] line-clamp-2 mt-0.5">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#222222]">
                    <Star className="w-3.5 h-3.5 fill-[#222222] text-[#222222]" />
                    <span>{listing.rating_avg ? listing.rating_avg.toFixed(2) : "5.0"}</span>
                    <span className="text-neutral-400">({listing.review_count} reviews)</span>
                  </div>
                </div>
              </div>

              {/* AirCover guarantee */}
              <div className="border-t border-neutral-200 pt-5 flex items-start gap-3 text-xs text-neutral-600">
                <ShieldCheck className="w-5 h-5 text-[#FF385C] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Your booking is covered by <strong className="text-[#222222]">AirCover</strong>: Free
                  protection against host cancellations and listing discrepancies.
                </p>
              </div>

              {/* Price Details */}
              <div className="border-t border-neutral-200 pt-5 space-y-4">
                <h4 className="font-bold text-base text-[#222222]">Price details</h4>
                {isQuotingPrice ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-neutral-100 rounded w-full" />
                    <div className="h-4 bg-neutral-100 rounded w-3/4" />
                    <div className="h-6 bg-neutral-200 rounded w-full pt-2" />
                  </div>
                ) : priceQuote ? (
                  <PriceBreakdown
                    nightlyRate={priceQuote.nightly_rate}
                    nights={priceQuote.nights}
                    cleaningFee={priceQuote.cleaning_fee}
                  />
                ) : (
                  <PriceBreakdown
                    nightlyRate={listing.price_per_night}
                    nights={nights}
                    cleaningFee={listing.cleaning_fee}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* ── Edit Dates Modal ── */}
      <Modal
        isOpen={isEditingDates}
        onClose={() => setIsEditingDates(false)}
        title="Edit Dates"
        maxWidth="lg"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div>
              <div className="font-semibold text-sm text-[#222222]">
                {tempCheckIn && tempCheckOut
                  ? `${tempCheckIn} to ${tempCheckOut}`
                  : tempCheckIn
                  ? "Select checkout date"
                  : "Select check-in date"}
              </div>
              <div className="text-xs text-neutral-500">Minimum stay 1 night</div>
            </div>
            {tempCheckIn && (
              <button
                type="button"
                onClick={() => {
                  setTempCheckIn(null);
                  setTempCheckOut(null);
                }}
                className="text-xs underline font-semibold text-neutral-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Simple Dual Month Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {[calendarMonth, addMonths(calendarMonth, 1)].map((mDate, mIdx) => {
              const mStart = startOfMonth(mDate);
              const mEnd = endOfMonth(mDate);
              const dStart = startOfWeek(mStart);
              const dEnd = endOfWeek(mEnd);
              const days = eachDayOfInterval({ start: dStart, end: dEnd });

              return (
                <div key={mIdx} className="space-y-2">
                  <div className="text-center font-bold text-xs text-[#222222]">
                    {format(mDate, "MMMM yyyy")}
                  </div>
                  <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-neutral-400">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-1">
                    {days.map((day) => {
                      const isCurrent = isSameMonth(day, mDate);
                      const isBlocked = isDateBlocked(day);
                      const isStart = tempCheckIn && isSameDay(day, parseISO(tempCheckIn));
                      const isEnd = tempCheckOut && isSameDay(day, parseISO(tempCheckOut));
                      const inRange =
                        tempCheckIn &&
                        tempCheckOut &&
                        isAfter(day, parseISO(tempCheckIn)) &&
                        isBefore(day, parseISO(tempCheckOut));

                      if (!isCurrent) return <div key={day.toString()} className="h-8" />;

                      return (
                        <div
                          key={day.toString()}
                          className={`h-8 flex items-center justify-center ${
                            inRange ? "bg-neutral-100" : ""
                          }`}
                        >
                          <button
                            type="button"
                            disabled={isBlocked}
                            onClick={() => handleModalDateClick(day)}
                            className={`w-7 h-7 rounded-full text-xs flex items-center justify-center transition-colors ${
                              isBlocked
                                ? "text-neutral-300 line-through cursor-not-allowed"
                                : isStart || isEnd
                                ? "bg-[#222222] text-white font-bold"
                                : "hover:border hover:border-black text-[#222222]"
                            }`}
                          >
                            {format(day, "d")}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsEditingDates(false)}
              className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-[#222222]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDates}
              disabled={!tempCheckIn || !tempCheckOut}
              className="px-6 py-2 rounded-xl bg-[#222222] text-white text-xs font-semibold hover:bg-black disabled:opacity-40"
            >
              Save dates
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Guests Modal ── */}
      <Modal
        isOpen={isEditingGuests}
        onClose={() => setIsEditingGuests(false)}
        title="Edit Guests"
        maxWidth="sm"
      >
        <div className="p-4 space-y-6">
          <Stepper
            title="Adults"
            subtitle="Age 13+"
            value={tempAdults}
            min={1}
            max={listing.max_guests - tempChildren}
            onChange={setTempAdults}
          />
          <Stepper
            title="Children"
            subtitle="Ages 2–12"
            value={tempChildren}
            min={0}
            max={listing.max_guests - tempAdults}
            onChange={setTempChildren}
          />

          <p className="text-xs text-neutral-500">
            This place has a maximum of {listing.max_guests} guests.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsEditingGuests(false)}
              className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-[#222222]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveGuests}
              className="px-6 py-2 rounded-xl bg-[#222222] text-white text-xs font-semibold hover:bg-black"
            >
              Save guests
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
