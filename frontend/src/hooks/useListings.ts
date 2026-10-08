"use client";

/**
 * useListings – fetches paginated listings from the backend.
 *
 * Key design decisions:
 *  - Uses AbortController so stale in-flight requests never update state
 *    after the filter changes or the component unmounts.
 *  - Infinite-scroll mode: append = true keeps accumulating pages.
 *  - Filter change resets back to page 1 and clears any accumulated items.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { api, ApiError } from "../lib/api";
import type { ListingSummary, ListingFilterParams } from "../types";

interface UseListingsReturn {
  listings: ListingSummary[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export function useListings(params: ListingFilterParams = {}): UseListingsReturn {
  const PAGE_SIZE = 20;

  // Stable serialisation of params to detect changes without deep-equal libs
  const paramsKey = JSON.stringify({ ...params, page: undefined });

  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks the current params key so we know when to reset
  const prevParamsKeyRef = useRef<string>("");

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean, signal: AbortSignal) => {
      if (append) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const data = await api.listings.list({
          ...params,
          page: pageNum,
          page_size: PAGE_SIZE,
        });

        if (signal.aborted) return; // drop stale response

        if (append) {
          setListings((prev) => [...prev, ...data.items]);
        } else {
          setListings(data.items);
        }
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.total_pages ?? Math.ceil((data.total || 0) / PAGE_SIZE));
      } catch (err) {
        if (signal.aborted) return;
        if (err instanceof ApiError) {
          setError(err.detail);
        } else {
          setError("Unable to connect to the backend. Is it running?");
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
          setIsFetchingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramsKey]
  );

  // Fetch page 1 whenever filters change
  useEffect(() => {
    const filtersChanged = paramsKey !== prevParamsKeyRef.current;
    prevParamsKeyRef.current = paramsKey;

    if (filtersChanged) {
      setListings([]);
      setPage(1);
    }

    const controller = new AbortController();
    fetchPage(1, false, controller.signal);

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  // Load next page (called by infinite-scroll sentinel or "Show more" button)
  const loadMore = useCallback(() => {
    if (isFetchingMore || isLoading) return;
    const nextPage = page + 1;
    if (nextPage > totalPages) return;
    const controller = new AbortController();
    fetchPage(nextPage, true, controller.signal);
  }, [isFetchingMore, isLoading, page, totalPages, fetchPage]);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    fetchPage(page, false, controller.signal);
  }, [page, fetchPage]);

  return {
    listings,
    total,
    page,
    totalPages,
    isLoading,
    isFetchingMore,
    error,
    hasMore: page < totalPages,
    loadMore,
    refetch,
  };
}
