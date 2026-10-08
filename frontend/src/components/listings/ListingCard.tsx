"use client";

/**
 * ListingCard.tsx
 *
 * Full-featured Airbnb-style listing card:
 *  - Square image carousel (up to 5 photos) with prev/next arrows on hover
 *    and dot indicators. Click on arrows does NOT navigate.
 *  - Heart/wishlist button (top-right) with optimistic API update + toast.
 *  - "Guest favourite" badge top-left when is_guest_favorite.
 *  - Text: City, Country (semibold) + ★ rating right; subtitle; bold price.
 *  - Click anywhere except carousel arrows → navigate to /listings/[id].
 */

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { useWishlist } from "../../hooks/useWishlist";
import { useAuth } from "../../hooks/useAuth";
import type { ListingSummary } from "../../types";

interface ListingCardProps {
  listing: ListingSummary;
  /** Called after toggling the heart so the parent can refresh its list */
  onWishlistChange?: () => void;
}

export function ListingCard({ listing, onWishlistChange }: ListingCardProps) {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { currentUser, openLoginModal } = useAuth();

  // Cap photos at 5; fall back to cover image if photos array absent
  const photos: string[] = listing.cover_image
    ? [listing.cover_image]
    : [];
  const MAX_PHOTOS = Math.min(photos.length, 5);
  const [photoIdx, setPhotoIdx] = useState(0);

  const prev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // prevent card navigation
      setPhotoIdx((i) => (i === 0 ? MAX_PHOTOS - 1 : i - 1));
    },
    [MAX_PHOTOS]
  );

  const next = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPhotoIdx((i) => (i === MAX_PHOTOS - 1 ? 0 : i + 1));
    },
    [MAX_PHOTOS]
  );

  const handleHeartClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentUser) {
        openLoginModal();
        return;
      }
      await toggleWishlist(listing.id);
      onWishlistChange?.();
    },
    [currentUser, openLoginModal, toggleWishlist, listing.id, onWishlistChange]
  );

  const navigateToListing = () => {
    router.push(`/listings/${listing.id}`);
  };

  const wishlisted = isWishlisted(listing.id);

  return (
    <div
      className="group flex flex-col cursor-pointer select-none"
      onClick={navigateToListing}
    >
      {/* ── Photo Container ──────────────────────────────────────────────── */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-100 mb-3">
        {/* Photo */}
        {photos.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[photoIdx]}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs">
            No photo
          </div>
        )}

        {/* ── Carousel Arrows (visible on hover) ─────────────────────────── */}
        {MAX_PHOTOS > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-105 z-10",
                photoIdx === 0 && "invisible"
              )}
            >
              <ChevronLeft className="w-4 h-4 text-neutral-800 stroke-[2.5]" />
            </button>
            <button
              onClick={next}
              aria-label="Next photo"
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-105 z-10",
                photoIdx === MAX_PHOTOS - 1 && "invisible"
              )}
            >
              <ChevronRight className="w-4 h-4 text-neutral-800 stroke-[2.5]" />
            </button>
          </>
        )}

        {/* ── Dot Indicators ─────────────────────────────────────────────── */}
        {MAX_PHOTOS > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === photoIdx
                    ? "w-2 h-2 bg-white"
                    : "w-1.5 h-1.5 bg-white/60"
                )}
              />
            ))}
          </div>
        )}

        {/* ── Guest Favourite Badge ───────────────────────────────────────── */}
        {(listing as ListingSummary & { is_guest_favorite?: boolean })
          .is_guest_favorite && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 rounded-full bg-white text-[11px] font-semibold text-[#222222] shadow-md">
              Guest favourite
            </span>
          </div>
        )}

        {/* ── Heart Button ───────────────────────────────────────────────── */}
        <button
          onClick={handleHeartClick}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 z-10 group/heart"
        >
          {/* Drop shadow ring makes the icon readable on any photo */}
          <Heart
            className={cn(
              "w-6 h-6 transition-all duration-200 group-hover/heart:scale-110",
              wishlisted
                ? "fill-[#FF385C] stroke-[#FF385C]"
                : "fill-black/20 stroke-white stroke-2"
            )}
          />
        </button>
      </div>

      {/* ── Text Metadata ────────────────────────────────────────────────── */}
      {/* Row 1: Location + Rating */}
      <div className="flex items-start justify-between gap-2 text-sm">
        <span className="font-semibold text-[#222222] truncate leading-snug">
          {listing.city}, {listing.country}
        </span>
        {listing.rating !== null && listing.rating !== undefined ? (
          <span className="flex items-center gap-0.5 shrink-0 text-xs text-[#222222] font-medium">
            <Star className="w-3.5 h-3.5 fill-current" />
            {listing.rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-xs text-[#717171] shrink-0">New</span>
        )}
      </div>

      {/* Row 2: Subtitle (category or room type) */}
      <p className="text-xs text-[#717171] mt-0.5 truncate capitalize">
        {listing.category?.name ?? listing.room_type.replace(/_/g, " ")}
      </p>

      {/* Row 3: Availability stub */}
      <p className="text-xs text-[#717171] truncate">
        {listing.max_guests} guest{listing.max_guests !== 1 ? "s" : ""}
      </p>

      {/* Row 4: Price */}
      <div className="mt-2">
        <span className="text-sm font-semibold text-[#222222]">
          ${listing.price_per_night.toFixed(0)}
        </span>
        <span className="text-sm text-[#717171]"> / night</span>
      </div>
    </div>
  );
}
