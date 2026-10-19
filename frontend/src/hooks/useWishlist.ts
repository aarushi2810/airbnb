"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "./useAuth";
import type { Wishlist, WishlistItem } from "../types";
import { toast } from "sonner";

export function useWishlist() {
  const { currentUser } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wishlistedIds, setWishlistedIds] = useState<Set<number>>(new Set());

  const fetchWishlist = useCallback(async () => {
    if (!currentUser) {
      setWishlist(null);
      setWishlistedIds(new Set());
      return;
    }
    try {
      setIsLoading(true);
      const data = await api.wishlist.get();
      setWishlist(data);
      const items = Array.isArray(data) ? data : (data as unknown as { items?: WishlistItem[] })?.items || [];
      const ids = new Set(items.map((item: any) => item.listing_id ?? item.id));
      setWishlistedIds(ids);
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = useCallback(
    async (listingId: number) => {
      if (!currentUser) {
        toast.error("Please select a user to save favorites");
        return false;
      }

      // Optimistic update
      const wasWishlisted = wishlistedIds.has(listingId);
      setWishlistedIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) {
          next.delete(listingId);
        } else {
          next.add(listingId);
        }
        return next;
      });

      try {
        const result = await api.wishlist.toggle(listingId);
        toast.success(
          result.wishlisted
            ? "Saved to favorites"
            : "Removed from favorites"
        );
        fetchWishlist();
        return result.wishlisted;
      } catch (err) {
        // Rollback optimistic update
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          if (wasWishlisted) {
            next.add(listingId);
          } else {
            next.delete(listingId);
          }
          return next;
        });

        if (err instanceof ApiError) {
          toast.error(err.detail);
        } else {
          toast.error("Failed to update wishlist");
        }
        return wasWishlisted;
      }
    },
    [currentUser, wishlistedIds, fetchWishlist]
  );

  const isWishlisted = useCallback(
    (listingId: number) => wishlistedIds.has(listingId),
    [wishlistedIds]
  );

  return {
    wishlist,
    items: wishlist?.items ?? [],
    wishlistedIds,
    isWishlisted,
    toggleWishlist,
    isLoading,
    refetch: fetchWishlist,
  };
}
