"use client";

/**
 * ListingDetailPage (/listings/[id])
 *
 * Full-featured Airbnb listing detail experience:
 *  - Comprehensive data fetching: listing details, availability (blocked ranges), and reviews.
 *  - Header with title, review meta, share link (toast notification), and save to wishlist.
 *  - Photo mosaic gallery (5-photo desktop layout & mobile carousel) with fullscreen modal.
 *  - Two-column layout:
 *    - Left: Property specs, host row, 3 key highlights, description with "Show more",
 *      bedroom sleeping arrangements, amenities preview & modal, dual-month availability
 *      calendar with real-time blocked date disabling, reviews breakdown & cards,
 *      location blurb & map preview, host card, and "Things to know".
 *    - Right: Sticky booking card with date picker & guest stepper, live price breakdown,
 *      overlap validation against blocked dates, and reserve action routing to /book/[listingId].
 *  - Mobile sticky bottom bar with Reserve action.
 */

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Container } from "../../../components/layout/Container";
import { PhotoGallery } from "../../../components/listings/PhotoGallery";
import { AmenitiesList } from "../../../components/listings/AmenitiesList";
import { ReviewsSection } from "../../../components/listings/ReviewsSection";
import { HostCard } from "../../../components/listings/HostCard";
import { AvailabilityCalendar } from "../../../components/listings/AvailabilityCalendar";
import { BookingCard } from "../../../components/booking/BookingCard";
import { api, ApiError } from "../../../lib/api";
import { formatPrice } from "../../../lib/utils";
import { useWishlist } from "../../../hooks/useWishlist";
import { useAuth } from "../../../hooks/useAuth";
import { toast } from "sonner";
import {
  Star,
  Share2,
  Heart,
  ArrowLeft,
  KeyRound,
  MapPin,
  CalendarCheck,
  Bed,
  Shield,
  Clock,
  AlertTriangle,
  Award,
  ChevronRight,
} from "lucide-react";
import type { ListingDetail, BookedDateRange, ReviewsPage } from "../../../types";

// ── Detail Skeleton ──────────────────────────────────────────────────────────
function ListingDetailSkeleton() {
  return (
    <div className="py-8 animate-pulse">
      <Container>
        {/* Title skeleton */}
        <div className="h-8 w-2/3 bg-neutral-200 rounded-lg mb-3" />
        <div className="h-4 w-1/3 bg-neutral-100 rounded mb-6" />

        {/* Gallery mosaic skeleton */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden bg-neutral-100">
          <div className="col-span-2 row-span-2 bg-neutral-200" />
          <div className="col-span-1 row-span-1 bg-neutral-200" />
          <div className="col-span-1 row-span-1 bg-neutral-200" />
          <div className="col-span-1 row-span-1 bg-neutral-200" />
          <div className="col-span-1 row-span-1 bg-neutral-200" />
        </div>

        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-10">
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="h-6 w-1/2 bg-neutral-200 rounded" />
            <div className="h-4 w-1/3 bg-neutral-100 rounded" />
            <div className="h-32 bg-neutral-100 rounded-xl" />
            <div className="h-48 bg-neutral-100 rounded-xl" />
          </div>
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="h-80 bg-neutral-200 rounded-2xl" />
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const listingId = Number(params?.id);

  const { isWishlisted, toggleWishlist } = useWishlist();
  const { currentUser, openLoginModal } = useAuth();

  // State
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [blockedRanges, setBlockedRanges] = useState<BookedDateRange[]>([]);
  const [reviewsPage, setReviewsPage] = useState<ReviewsPage>({
    items: [],
    total: 0,
    page: 1,
    has_more: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reservation Form State (initialized from URL if present)
  const [checkIn, setCheckIn] = useState<string | null>(
    searchParams.get("checkIn") || null
  );
  const [checkOut, setCheckOut] = useState<string | null>(
    searchParams.get("checkOut") || null
  );
  const [guests, setGuests] = useState<number>(
    searchParams.get("guests") ? Number(searchParams.get("guests")) : 1
  );

  // Modal / UI states
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  const calendarSectionRef = useRef<HTMLDivElement>(null);

  // Fetch listing data, blocked dates, and reviews
  useEffect(() => {
    if (!listingId || isNaN(listingId)) {
      setError("Invalid listing ID");
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      api.listings.getById(listingId),
      api.listings.getAvailability(listingId).catch(() => [] as BookedDateRange[]),
      api.listings.getReviews(listingId).catch(() => ({
        items: [],
        total: 0,
        page: 1,
        has_more: false,
      } as ReviewsPage)),
    ])
      .then(([listingData, availabilityData, reviewsData]) => {
        if (!isMounted) return;
        setListing(listingData);
        setBlockedRanges(availabilityData);
        setReviewsPage(reviewsData);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof ApiError && err.status === 404) {
          setError("Listing not found");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load listing details");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [listingId]);

  // Wishlist handler
  const handleToggleWishlist = async () => {
    if (!listing) return;
    if (!currentUser) {
      openLoginModal();
      return;
    }
    const currentlyWishlisted = isWishlisted(listing.id);
    await toggleWishlist(listing.id);
    toast.success(
      currentlyWishlisted ? "Removed from Wishlist" : "Saved to Wishlist"
    );
  };

  // Share handler
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // Scroll to calendar when clicking date box
  const scrollToCalendar = () => {
    if (calendarSectionRef.current) {
      calendarSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // ── Loading & Error States ──────────────────────────────────────────────────
  if (isLoading) {
    return <ListingDetailSkeleton />;
  }

  if (error || !listing) {
    return (
      <div className="py-20 text-center">
        <Container>
          <div className="max-w-md mx-auto p-8 rounded-2xl border border-neutral-200 bg-neutral-50">
            <h1 className="text-xl font-bold text-[#222222] mb-2">
              {error || "Listing not found"}
            </h1>
            <p className="text-sm text-neutral-500 mb-6">
              The listing you are looking for may have been deactivated or removed.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#222222] text-white text-sm font-semibold hover:bg-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Explore
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const saved = isWishlisted(listing.id);

  return (
    <div className="py-6 sm:py-8">
      <Container>
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-[#222222] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to explore
          </Link>
        </div>

        {/* ── Top Header ── */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight">
            {listing.title}
          </h1>

          <div className="flex items-center justify-between mt-2 flex-wrap gap-3 text-sm text-[#222222]">
            {/* Review count & location */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Star className="w-4 h-4 fill-[#222222] text-[#222222]" />
              <span className="font-semibold">
                {listing.rating_avg ? listing.rating_avg.toFixed(2) : "New"}
              </span>
              <span className="text-neutral-400">·</span>
              <span className="underline font-semibold cursor-pointer">
                {listing.review_count} reviews
              </span>
              {listing.is_guest_favorite && (
                <>
                  <span className="text-neutral-400">·</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-xs font-semibold text-[#222222]">
                    <Award className="w-3 h-3 text-amber-600" /> Guest favourite
                  </span>
                </>
              )}
              <span className="text-neutral-400">·</span>
              <span className="underline font-semibold text-neutral-600">
                {listing.city}
                {listing.state ? `, ${listing.state}` : ""}, {listing.country}
              </span>
            </div>

            {/* Share & Save Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 underline text-xs font-semibold text-[#222222] hover:text-black py-1"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                className="flex items-center gap-2 underline text-xs font-semibold text-[#222222] hover:text-black py-1"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    saved ? "fill-[#FF385C] text-[#FF385C]" : "text-[#222222]"
                  }`}
                />
                <span>{saved ? "Saved" : "Save"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Photo Gallery Mosaic & Modal ── */}
        <PhotoGallery
          images={listing.images}
          title={listing.title}
          isWishlisted={saved}
          onToggleWishlist={handleToggleWishlist}
          onShare={handleShare}
        />

        {/* ── Main Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-8">
          {/* ── Left Column (Listing Details) ── */}
          <div className="lg:col-span-7 xl:col-span-8">
            {/* Property Summary & Host Row */}
            <div className="pb-6 border-b border-neutral-200">
              <h2 className="text-xl sm:text-2xl font-bold text-[#222222]">
                Entire {listing.property_type || "home"} in {listing.city},{" "}
                {listing.country}
              </h2>
              <div className="text-sm text-neutral-600 mt-1">
                {listing.max_guests} guests · {listing.bedrooms} bedroom
                {listing.bedrooms !== 1 ? "s" : ""} · {listing.beds} bed
                {listing.beds !== 1 ? "s" : ""} · {listing.bathrooms} bath
                {listing.bathrooms !== 1 ? "s" : ""}
              </div>

              {/* Host Quick Pill */}
              <div className="mt-5 flex items-center gap-4 pt-4 border-t border-neutral-100">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-100 shrink-0">
                  <Image
                    src={listing.host.avatar_url || "https://i.pravatar.cc/150?img=47"}
                    alt={listing.host.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#222222]">
                    Hosted by {listing.host.name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {listing.host.is_superhost ? "Superhost · " : ""}
                    Joined {listing.host.joined_at ? new Date(listing.host.joined_at).getFullYear() : 2022}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Highlights ── */}
            <div className="py-8 border-b border-neutral-200 space-y-6">
              <div className="flex items-start gap-4">
                <KeyRound className="w-6 h-6 text-neutral-700 shrink-0 mt-0.5 stroke-[1.5]" />
                <div>
                  <h4 className="font-semibold text-sm text-[#222222]">Self check-in</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Check yourself in with the digital keypad or lockbox.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-neutral-700 shrink-0 mt-0.5 stroke-[1.5]" />
                <div>
                  <h4 className="font-semibold text-sm text-[#222222]">Great location</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    95% of recent guests gave the location a 5-star rating.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CalendarCheck className="w-6 h-6 text-neutral-700 shrink-0 mt-0.5 stroke-[1.5]" />
                <div>
                  <h4 className="font-semibold text-sm text-[#222222]">
                    Free cancellation before 48 hours
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Full refund if cancelled at least 48 hours before check-in.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Description ── */}
            <div className="py-8 border-b border-neutral-200">
              <h3 className="font-bold text-lg text-[#222222] mb-3">About this space</h3>
              <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line line-clamp-5">
                {listing.description ||
                  "Welcome to this peaceful, beautifully designed retreat. Perfect for families, remote work, or quiet weekend getaways."}
              </p>
              {listing.description && listing.description.length > 250 && (
                <button
                  type="button"
                  onClick={() => setShowDescriptionModal(true)}
                  className="mt-3 inline-flex items-center gap-1 font-semibold underline text-sm hover:text-black"
                >
                  <span>Show more</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ── Where you'll sleep ── */}
            <div className="py-8 border-b border-neutral-200">
              <h3 className="font-bold text-lg text-[#222222] mb-5">Where you&apos;ll sleep</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(Math.max(1, listing.bedrooms))].map((_, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border border-neutral-200 space-y-3 bg-neutral-50/50"
                  >
                    <Bed className="w-6 h-6 text-neutral-700 stroke-[1.5]" />
                    <div>
                      <div className="font-bold text-sm text-[#222222]">
                        Bedroom {i + 1}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {i === 0 ? "1 queen bed" : "2 single beds"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Amenities List ── */}
            <div className="border-b border-neutral-200">
              <AmenitiesList amenities={listing.amenities} />
            </div>

            {/* ── Availability Calendar ── */}
            <div ref={calendarSectionRef} className="border-b border-neutral-200">
              <AvailabilityCalendar
                blockedRanges={blockedRanges}
                checkIn={checkIn}
                checkOut={checkOut}
                onChangeDates={(ci, co) => {
                  setCheckIn(ci);
                  setCheckOut(co);
                }}
                city={listing.city}
              />
            </div>

            {/* ── Reviews Section ── */}
            <div className="border-b border-neutral-200">
              <ReviewsSection listing={listing} reviewsPage={reviewsPage} />
            </div>

            {/* ── Where you'll be (Location Preview) ── */}
            <div className="py-8 border-b border-neutral-200">
              <h3 className="font-bold text-lg text-[#222222] mb-2">Where you&apos;ll be</h3>
              <p className="text-sm text-neutral-600 mb-5">
                {listing.city}
                {listing.state ? `, ${listing.state}` : ""}, {listing.country}
              </p>

              {/* Styled Map Graphic / Preview Box */}
              <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-neutral-200 bg-emerald-50/30 flex items-center justify-center shadow-inner">
                {/* Decorative map grid background */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(#10b981 1px, transparent 1px), radial-gradient(#10b981 1px, #f9fafb 1px)",
                    backgroundSize: "24px 24px",
                    backgroundPosition: "0 0, 12px 12px",
                  }}
                />

                {/* Pin Card */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#FF385C] text-white flex items-center justify-center shadow-xl ring-4 ring-white animate-bounce">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="mt-3 px-4 py-2 bg-white rounded-xl shadow-lg border border-neutral-200 text-center">
                    <p className="font-bold text-xs text-[#222222]">
                      Exact location provided after booking
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {listing.city}, {listing.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Host Profile Card ── */}
            <div className="border-b border-neutral-200">
              <HostCard host={listing.host} listing={listing} />
            </div>

            {/* ── Things to Know ── */}
            <div className="py-8">
              <h3 className="font-bold text-lg text-[#222222] mb-6">Things to know</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                {/* House Rules */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-[#222222]">House rules</h4>
                  <p className="text-neutral-600 text-xs flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Check-in after 3:00 PM
                  </p>
                  <p className="text-neutral-600 text-xs flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Checkout before 11:00 AM
                  </p>
                  <p className="text-neutral-600 text-xs">
                    {listing.max_guests} guests maximum
                  </p>
                </div>

                {/* Safety & Property */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-[#222222]">Safety & property</h4>
                  <p className="text-neutral-600 text-xs flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Smoke alarm installed
                  </p>
                  <p className="text-neutral-600 text-xs flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Carbon monoxide detector
                  </p>
                  <p className="text-neutral-600 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> Security camera on exterior
                  </p>
                </div>

                {/* Cancellation Policy */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-[#222222]">Cancellation policy</h4>
                  <p className="text-neutral-600 text-xs">
                    Free cancellation for 48 hours. Review the host&apos;s full
                    cancellation policy for exact refund schedules.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column (Sticky Reservation Widget) ── */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="sticky top-28">
              <BookingCard
                listing={listing}
                isHostOwner={Boolean(currentUser && currentUser.id === listing.host.id)}
                blockedRanges={blockedRanges}
                checkIn={checkIn}
                checkOut={checkOut}
                onChangeDates={(ci, co) => {
                  setCheckIn(ci);
                  setCheckOut(co);
                }}
                guests={guests}
                onChangeGuests={setGuests}
                onFocusCalendar={scrollToCalendar}
              />
            </div>
          </div>
        </div>
      </Container>

      {/* ── Mobile Fixed Bottom Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 px-6 py-3.5 flex items-center justify-between shadow-2xl">
        <div>
          <div>
            <span className="text-base font-bold text-[#222222]">
              {formatPrice(listing.price_per_night)}
            </span>
            <span className="text-xs text-neutral-500"> / night</span>
          </div>
          <button
            type="button"
            onClick={scrollToCalendar}
            className="text-xs underline text-neutral-700 font-medium block"
          >
            {checkIn && checkOut ? `${checkIn} – ${checkOut}` : "Select dates"}
          </button>
        </div>

        {currentUser && currentUser.id === listing.host.id ? (
          <Link
            href={`/host/listings/${listing.id}/edit`}
            className="px-5 py-2.5 rounded-xl bg-[#222222] text-white font-semibold text-xs hover:bg-black transition-colors"
          >
            Edit listing
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (checkIn && checkOut) {
                router.push(
                  `/book/${listing.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
                );
              } else {
                scrollToCalendar();
              }
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white font-semibold text-sm shadow hover:opacity-95"
          >
            {checkIn && checkOut ? "Reserve" : "Check availability"}
          </button>
        )}
      </div>

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[80vh] flex flex-col p-6 shadow-2xl">
            <h3 className="font-bold text-lg mb-4 text-[#222222]">About this space</h3>
            <div className="flex-1 overflow-y-auto text-sm text-neutral-700 leading-relaxed whitespace-pre-line mb-6">
              {listing.description}
            </div>
            <button
              onClick={() => setShowDescriptionModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#222222] text-white font-semibold text-sm hover:bg-black transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
