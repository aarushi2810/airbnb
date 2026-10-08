"use client";

/**
 * ReviewsSection.tsx
 *
 * Comprehensive Airbnb review presentation:
 *  - Guest favourite banner (if is_guest_favorite).
 *  - Overall rating & review count header.
 *  - 6 category breakdown bars (Cleanliness, Accuracy, Communication, Location, Check-in, Value).
 *  - 2-column grid of guest reviews with expandable text.
 *  - "Show all N reviews" modal.
 */

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Star, Award, X } from "lucide-react";
import { formatDate } from "../../lib/utils";
import type { ListingDetail, ReviewsPage } from "../../types";

interface ReviewsSectionProps {
  listing: ListingDetail;
  reviewsPage: ReviewsPage;
}

export function ReviewsSection({ listing, reviewsPage }: ReviewsSectionProps) {
  const [showAllModal, setShowAllModal] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

  // Keyboard Escape for modal
  useEffect(() => {
    if (!showAllModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAllModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [showAllModal]);

  const toggleExpand = (id: number) => {
    setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Category rating averages (fallback to listing rating_avg if specific subcategories are missing)
  const categories = [
    { name: "Cleanliness", score: reviewsPage.avg_cleanliness ?? listing.rating_avg ?? 4.9 },
    { name: "Accuracy", score: reviewsPage.avg_accuracy ?? listing.rating_avg ?? 4.9 },
    { name: "Communication", score: reviewsPage.avg_communication ?? listing.rating_avg ?? 4.9 },
    { name: "Location", score: reviewsPage.avg_location ?? listing.rating_avg ?? 4.8 },
    { name: "Check-in", score: reviewsPage.avg_checkin ?? listing.rating_avg ?? 4.9 },
    { name: "Value", score: reviewsPage.avg_value ?? listing.rating_avg ?? 4.8 },
  ];

  const reviews = reviewsPage.items || [];
  const previewReviews = reviews.slice(0, 6);

  return (
    <div className="py-8">
      {/* Guest Favourite Banner */}
      {listing.is_guest_favorite && (
        <div className="mb-8 p-6 rounded-2xl border border-neutral-200 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#222222]">Guest favourite</h3>
              <p className="text-xs text-neutral-500 max-w-md mt-0.5">
                One of the most loved homes on Airbnb based on ratings, reviews, and reliability.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xl font-extrabold text-[#222222]">
                {listing.rating_avg ? listing.rating_avg.toFixed(2) : "5.0"}
              </div>
              <div className="flex text-amber-500 text-xs mt-0.5 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                ))}
              </div>
            </div>
            <div className="w-px h-10 bg-neutral-200" />
            <div className="text-center">
              <div className="text-xl font-extrabold text-[#222222]">{listing.review_count}</div>
              <div className="text-xs text-neutral-500 mt-0.5">Reviews</div>
            </div>
          </div>
        </div>
      )}

      {/* Header if not guest favorite */}
      {!listing.is_guest_favorite && (
        <div className="flex items-center gap-2 mb-6 text-xl font-bold text-[#222222]">
          <Star className="w-5 h-5 fill-[#222222] text-[#222222]" />
          <span>
            {listing.rating_avg ? listing.rating_avg.toFixed(2) : "New"} · {listing.review_count}{" "}
            reviews
          </span>
        </div>
      )}

      {/* Category Ratings Breakdown Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-3 mb-8">
        {categories.map((cat) => {
          const score = Number(cat.score).toFixed(1);
          const percent = Math.min(100, (Number(cat.score) / 5) * 100);
          return (
            <div key={cat.name} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-[#222222] font-normal">{cat.name}</span>
              <div className="flex items-center gap-3 w-40">
                <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#222222] rounded-full" style={{ width: `${percent}%` }} />
                </div>
                <span className="text-xs font-semibold text-[#222222] w-6 text-right">
                  {score}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Cards Grid */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 mb-8">
          {previewReviews.map((rev) => {
            const authorName = rev.author?.name || "Guest";
            const avatarUrl =
              rev.author?.avatar_url || "https://i.pravatar.cc/150?img=12";
            const isLong = (rev.comment || "").length > 180;
            const isExpanded = expandedReviews[rev.id];

            return (
              <div key={rev.id} className="space-y-3">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-100 shrink-0">
                    <Image
                      src={avatarUrl}
                      alt={authorName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#222222]">{authorName}</h4>
                    <p className="text-xs text-neutral-500">
                      {formatDate(rev.created_at)}
                    </p>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.round(rev.rating)
                          ? "fill-[#222222] text-[#222222]"
                          : "fill-neutral-200 text-neutral-200"
                      }`}
                    />
                  ))}
                </div>

                {/* Comment Text */}
                <div className="text-sm text-[#222222] leading-relaxed">
                  <p className={!isExpanded && isLong ? "line-clamp-3" : ""}>
                    {rev.comment}
                  </p>
                  {isLong && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(rev.id)}
                      className="mt-1 font-semibold underline text-sm hover:text-neutral-700"
                    >
                      {isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-neutral-500 italic py-4">
          No reviews yet for this listing. Be one of the first guests to review!
        </div>
      )}

      {/* Show all reviews button */}
      {reviews.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAllModal(true)}
          className="px-6 py-3 border border-[#222222] rounded-xl font-semibold text-sm text-[#222222] hover:bg-neutral-50 active:scale-[0.99] transition-all"
        >
          Show all {listing.review_count} reviews
        </button>
      )}

      {/* Full Reviews Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <button
                onClick={() => setShowAllModal(false)}
                className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-800"
                aria-label="Close reviews modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1.5 font-bold text-base text-[#222222]">
                <Star className="w-4 h-4 fill-[#222222] text-[#222222]" />
                <span>
                  {listing.rating_avg ? listing.rating_avg.toFixed(2) : "5.0"} ·{" "}
                  {listing.review_count} reviews
                </span>
              </div>
              <div className="w-5" />
            </div>

            {/* Scrollable Reviews List */}
            <div className="flex-1 overflow-y-auto px-6 py-6 divide-y divide-neutral-200 space-y-6">
              {reviews.map((rev, idx) => {
                const authorName = rev.author?.name || "Guest";
                const avatarUrl =
                  rev.author?.avatar_url || "https://i.pravatar.cc/150?img=12";
                return (
                  <div key={rev.id} className={idx > 0 ? "pt-6" : ""}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-100 shrink-0">
                        <Image
                          src={avatarUrl}
                          alt={authorName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-[#222222]">{authorName}</h4>
                        <p className="text-xs text-neutral-500">
                          {formatDate(rev.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.round(rev.rating)
                              ? "fill-[#222222] text-[#222222]"
                              : "fill-neutral-200 text-neutral-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-neutral-800 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
