"use client";

/**
 * HostCard.tsx
 *
 * "Meet your host" profile card:
 *  - Host avatar, name, Superhost badge, review stats, and experience.
 *  - Response rate and response time details.
 *  - Host bio.
 *  - "Message Host" button (opens Coming Soon modal).
 *  - Airbnb trust & safety protection guarantee note.
 */

import React, { useState } from "react";
import Image from "next/image";
import { Award, ShieldCheck, MessageSquare } from "lucide-react";
import { ComingSoonModal } from "../ui/ComingSoonModal";
import type { HostSummary, ListingDetail } from "../../types";

interface HostCardProps {
  host: HostSummary;
  listing: ListingDetail;
}

export function HostCard({ host, listing }: HostCardProps) {
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Derive years hosting from joined_at or fallback
  const joinedYear = host.joined_at ? new Date(host.joined_at).getFullYear() : 2022;
  const yearsHosting = Math.max(1, new Date().getFullYear() - joinedYear);

  return (
    <div className="py-8">
      <h2 className="text-xl font-bold text-[#222222] mb-6">Meet your Host</h2>

      <div className="rounded-3xl bg-[#F0EFE9]/40 p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Left Badge Card */}
        <div className="rounded-3xl bg-white p-6 shadow-md border border-neutral-100 flex flex-col items-center text-center w-full md:w-72 shrink-0">
          <div className="relative mb-3">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-neutral-100 shadow-inner">
              <Image
                src={host.avatar_url || "https://i.pravatar.cc/150?img=47"}
                alt={host.name}
                fill
                className="object-cover"
              />
            </div>
            {host.is_superhost && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FF385C] text-white flex items-center justify-center shadow-md">
                <Award className="w-4 h-4" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-[#222222]">{host.name}</h3>
          <p className="text-xs text-neutral-500 font-medium">
            {host.is_superhost ? "Superhost" : "Host"}
          </p>

          <div className="w-full grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-neutral-100 text-left">
            <div>
              <div className="text-lg font-extrabold text-[#222222]">
                {listing.review_count}
              </div>
              <div className="text-[11px] text-neutral-500">Reviews</div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-[#222222]">
                {listing.rating_avg ? listing.rating_avg.toFixed(1) : "5.0"}★
              </div>
              <div className="text-[11px] text-neutral-500">Rating</div>
            </div>
            <div className="col-span-2 pt-2">
              <div className="text-lg font-extrabold text-[#222222]">
                {yearsHosting}
              </div>
              <div className="text-[11px] text-neutral-500">Years hosting</div>
            </div>
          </div>
        </div>

        {/* Right Details */}
        <div className="flex-1 space-y-5 text-sm text-[#222222]">
          <div>
            <h4 className="font-bold text-base mb-1">Host details</h4>
            <p className="text-neutral-600 leading-relaxed">
              Response rate: {host.response_rate ?? 98}%
            </p>
            <p className="text-neutral-600 leading-relaxed">
              Responds within an hour
            </p>
          </div>

          {host.bio && (
            <div>
              <h4 className="font-bold text-base mb-1">About {host.name}</h4>
              <p className="text-neutral-700 leading-relaxed">{host.bio}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowComingSoon(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#222222] text-white font-semibold text-sm hover:bg-black transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message Host</span>
            </button>
          </div>

          {/* Safety note */}
          <div className="pt-4 border-t border-neutral-200/60 flex items-start gap-3 text-xs text-neutral-500">
            <ShieldCheck className="w-5 h-5 text-[#FF385C] shrink-0 mt-0.5" />
            <p>
              To protect your payment, never transfer money or communicate outside of
              the Airbnb website or app.
            </p>
          </div>
        </div>
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        feature="messages"
      />
    </div>
  );
}
