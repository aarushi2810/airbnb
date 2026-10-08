"use client";

/**
 * EditListingPage
 *
 * Route: /host/listings/[id]/edit
 * Fetches existing listing, validates host ownership, and mounts ListingForm in edit mode.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Container } from "../../../../../components/layout/Container";
import { ListingForm } from "../../../../../components/host/ListingForm";
import { useRequireHost } from "../../../../../hooks/useRequireHost";
import { apiClient } from "../../../../../lib/api";
import type { ListingDetail } from "../../../../../types";

export default function EditListingPage() {
  const params = useParams();
  const listingId = Number(params?.id);

  const { currentUser, isLoading: authLoading } = useRequireHost();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId || isNaN(listingId)) {
      setError("Invalid listing ID");
      setLoading(false);
      return;
    }

    let cancelled = false;
    apiClient.listings
      .getById(listingId)
      .then((data) => {
        if (!cancelled) {
          setListing(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load listing");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (authLoading || loading) {
    return (
      <Container className="py-12">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-6 w-36 bg-neutral-200 rounded" />
          <div className="h-80 bg-neutral-100 rounded-2xl" />
        </div>
      </Container>
    );
  }

  if (error || !listing) {
    return (
      <Container className="py-16 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#222222]">Listing Not Found</h2>
          <p className="text-xs text-[#717171]">{error || "Could not retrieve listing details."}</p>
          <Link
            href="/host/dashboard?tab=listings"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#222222] text-white text-xs font-semibold hover:bg-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </Container>
    );
  }

  // Ownership verification check
  const isOwner = currentUser && currentUser.id === listing.host.id;
  if (!isOwner) {
    return (
      <Container className="py-16 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#222222]">Permission Denied</h2>
          <p className="text-xs text-[#717171]">
            You do not own listing #{listingId} (&ldquo;{listing.title}&rdquo;). Only the listing host can make edits.
          </p>
          <Link
            href="/host/dashboard?tab=listings"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#222222] text-white text-xs font-semibold hover:bg-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <div className="py-8">
      <Container>
        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
          <Link
            href="/host/dashboard?tab=listings"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#717171] hover:text-[#222222] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to host dashboard
          </Link>

          <Link
            href={`/listings/${listing.id}`}
            target="_blank"
            className="text-xs font-semibold text-[#FF385C] hover:underline"
          >
            Preview public page →
          </Link>
        </div>

        <ListingForm mode="edit" initialData={listing} />
      </Container>
    </div>
  );
}
