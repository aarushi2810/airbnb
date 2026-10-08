"use client";

/**
 * NewListingPage
 *
 * Route: /host/listings/new
 * Mounts the multi-step ListingForm wizard in creation mode.
 */

import React from "react";
import Link from "next/link";
import { Container } from "../../../../components/layout/Container";
import { ListingForm } from "../../../../components/host/ListingForm";
import { useRequireHost } from "../../../../hooks/useRequireHost";
import { ArrowLeft } from "lucide-react";

export default function NewListingPage() {
  const { currentUser, isLoading } = useRequireHost();

  if (isLoading || !currentUser) {
    return (
      <Container className="py-12">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-6 w-32 bg-neutral-200 rounded" />
          <div className="h-64 bg-neutral-100 rounded-2xl" />
        </div>
      </Container>
    );
  }

  return (
    <div className="py-8">
      <Container>
        <div className="max-w-4xl mx-auto mb-6">
          <Link
            href="/host/dashboard?tab=listings"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#717171] hover:text-[#222222] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to host dashboard
          </Link>
        </div>

        <ListingForm mode="create" />
      </Container>
    </div>
  );
}
