"use client";

/**
 * /wishlists/page.tsx
 *
 * Saved Favorites & Wishlists View:
 *  - Grid of saved stays reusing ListingCard.
 *  - Optimistic removal with smooth fade-out when un-hearting a listing.
 *  - Logged-out state with prompt and "Log in" action button.
 *  - Responsive empty state ("Create your first wishlist").
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Container } from "../../components/layout/Container";
import { ListingCard } from "../../components/listings/ListingCard";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../hooks/useWishlist";
import { Heart, ArrowRight, Lock } from "lucide-react";
import type { ListingSummary, WishlistItem } from "../../types";

export default function WishlistsPage() {
  const { currentUser, isLoading: isAuthLoading, openLoginModal } = useAuth();
  const { wishlist, isLoading: isWishlistLoading } = useWishlist();

  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [fadingIds, setFadingIds] = useState<Set<number>>(new Set());

  // Fetch full listing summaries for wishlisted items
  useEffect(() => {
    if (!currentUser) {
      setListings([]);
      return;
    }

    const items = (Array.isArray(wishlist) ? wishlist : wishlist?.items || []) as WishlistItem[];
    const itemSummaries = items
      .map((it) => it.listing)
      .filter((l): l is ListingSummary => Boolean(l));

    setListings(itemSummaries);
  }, [currentUser, wishlist]);

  // When a heart is toggled off, trigger fade-out then remove
  const handleWishlistChange = (listingId: number) => {
    setFadingIds((prev) => new Set([...prev, listingId]));
    setTimeout(() => {
      setListings((prev) => prev.filter((item) => item.id !== listingId));
      setFadingIds((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    }, 300);
  };

  // ── Logged-out State ──
  if (!isAuthLoading && !currentUser) {
    return (
      <div className="py-20 text-center">
        <Container>
          <div className="max-w-md mx-auto p-8 rounded-3xl border border-neutral-200 bg-neutral-50/50 space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#222222]">Log in to view wishlists</h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              You can create, view, or edit wishlists once you&apos;ve logged in to your account.
            </p>
            <button
              type="button"
              onClick={openLoginModal}
              className="px-8 py-3 rounded-xl bg-[#222222] text-white text-sm font-semibold hover:bg-black transition-colors"
            >
              Log in
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 min-h-screen bg-white">
      <Container>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">Wishlists</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Keep track of the stays and destinations you love most.
          </p>
        </div>

        {/* Loading skeleton */}
        {isWishlistLoading && listings.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-square bg-neutral-200 rounded-2xl" />
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isWishlistLoading && listings.length === 0 && (
          <div className="py-16 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#222222]">Create your first wishlist</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              As you search, tap the heart icon on any stay to save your favorite places to your
              wishlist.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#222222] text-white text-sm font-semibold hover:bg-black transition-colors"
            >
              <span>Explore stays</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Listings Grid */}
        {listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((item) => (
              <div
                key={item.id}
                className={`transition-all duration-300 ${
                  fadingIds.has(item.id) ? "opacity-0 scale-95 pointer-events-none" : "opacity-100"
                }`}
              >
                <ListingCard
                  listing={item}
                  onWishlistChange={() => handleWishlistChange(item.id)}
                />
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
