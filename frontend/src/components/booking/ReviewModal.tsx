"use client";

/**
 * ReviewModal.tsx
 *
 * Interactive Airbnb review submission modal:
 *  - Overall 5-star rating with hover preview.
 *  - 6 category rating star rows (Cleanliness, Accuracy, Communication, Location, Check-in, Value).
 *  - Comment textarea requiring at least 10 characters.
 *  - Real-time submission calling POST /api/listings/{listingId}/reviews.
 *  - Recomputes listing aggregates upon completion.
 */

import React, { useState } from "react";
import { Star, X, AlertCircle } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { toast } from "sonner";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: number;
  listingTitle: string;
  bookingId?: number;
  onSuccess: () => void;
}

const CATEGORIES = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "accuracy", label: "Accuracy" },
  { key: "communication", label: "Communication" },
  { key: "location", label: "Location" },
  { key: "checkin", label: "Check-in" },
  { key: "value", label: "Value" },
] as const;

export function ReviewModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  bookingId,
  onSuccess,
}: ReviewModalProps) {
  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({
    cleanliness: 5,
    accuracy: 5,
    communication: 5,
    location: 5,
    checkin: 5,
    value: 5,
  });
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCategoryChange = (key: string, rating: number) => {
    setCategoryRatings((prev) => ({ ...prev, [key]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      setError("Please write at least 10 characters describing your experience.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.bookings.postReview(listingId, {
        rating: overallRating,
        booking_id: bookingId,
        cleanliness: categoryRatings.cleanliness,
        accuracy: categoryRatings.accuracy,
        communication: categoryRatings.communication,
        location: categoryRatings.location,
        checkin: categoryRatings.checkin,
        value: categoryRatings.value,
        comment: comment.trim(),
      });

      toast.success("Thank you! Your review has been published.");
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Failed to submit review. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-base text-[#222222]">Leave a Review</h3>
          <div className="w-5" />
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div>
            <h4 className="font-bold text-lg text-[#222222] mb-1">
              How was your stay at {listingTitle}?
            </h4>
            <p className="text-xs text-neutral-500">
              Your feedback helps hosts improve and gives future guests honest insight.
            </p>
          </div>

          {/* Overall Star Rating */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Overall Rating
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled =
                  hoverRating !== null ? star <= hoverRating : star <= overallRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setOverallRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        filled
                          ? "fill-[#FF385C] text-[#FF385C]"
                          : "fill-neutral-200 text-neutral-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="text-xs font-medium text-neutral-700">
              {overallRating === 5
                ? "5 stars - Exceptional"
                : overallRating === 4
                ? "4 stars - Very Good"
                : overallRating === 3
                ? "3 stars - Average"
                : overallRating === 2
                ? "2 stars - Below Expectations"
                : "1 star - Poor"}
            </div>
          </div>

          {/* Category Ratings */}
          <div className="space-y-3 pt-2">
            <h5 className="font-bold text-sm text-[#222222]">Category Ratings</h5>
            <div className="space-y-2.5">
              {CATEGORIES.map(({ key, label }) => {
                const currentScore = categoryRatings[key] || 5;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1 text-sm text-[#222222]"
                  >
                    <span className="text-neutral-700">{label}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleCategoryChange(key, s)}
                          className="p-0.5"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              s <= currentScore
                                ? "fill-[#222222] text-[#222222]"
                                : "fill-neutral-200 text-neutral-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="review-comment" className="font-bold text-[#222222]">
                Your Review
              </label>
              <span
                className={`${
                  comment.trim().length >= 10 ? "text-emerald-600" : "text-neutral-400"
                }`}
              >
                {comment.trim().length} / 10 min chars
              </span>
            </div>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What made your stay special? How was the host's communication and check-in?"
              className="w-full p-3.5 rounded-xl border border-neutral-300 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || comment.trim().length < 10}
              className="w-full py-3.5 rounded-xl bg-[#222222] text-white font-semibold text-sm hover:bg-black transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting review...</span>
                </>
              ) : (
                <span>Submit review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
