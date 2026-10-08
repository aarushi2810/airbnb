"use client";

/**
 * /trips/page.tsx
 *
 * My Trips Reservation Management:
 *  - Categorized tabs: Upcoming, Past, Cancelled with dynamic count badges.
 *  - Rich trip cards: Cover image, title, city/country, formatted date ranges, guests,
 *    total price paid, and status badge.
 *  - Cancel booking workflow with confirmation modal and cancellation policy display.
 *  - "Leave a review" workflow for past trips opening ReviewModal.
 *  - Responsive empty states with "Start searching" explore CTA.
 *  - Guarded with useRequireAuth.
 */

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "../../components/layout/Container";
import { Modal } from "../../components/ui/Modal";
import { ReviewModal } from "../../components/booking/ReviewModal";
import { api, ApiError } from "../../lib/api";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { formatPrice, formatDate } from "../../lib/utils";
import { toast } from "sonner";
import {
  Luggage,
  Calendar,
  ArrowRight,
  AlertTriangle,
  Star,
  ExternalLink,
} from "lucide-react";
import { parseISO, format, isBefore, startOfToday, differenceInCalendarDays } from "date-fns";
import type { Booking } from "../../types";

type TabType = "upcoming" | "past" | "cancelled";

export default function TripsPage() {
  useRequireAuth({ triggerModal: true });

  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cancel modal state
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Review modal state
  const [bookingToReview, setBookingToReview] = useState<Booking | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<number>>(new Set());

  // Load user's bookings
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await api.bookings.listMy();
      setBookings(data);
    } catch {
      toast.error("Failed to load your reservations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const today = useMemo(() => startOfToday(), []);

  // Split bookings by category
  const { upcoming, past, cancelled } = useMemo(() => {
    const up: Booking[] = [];
    const pa: Booking[] = [];
    const ca: Booking[] = [];

    bookings.forEach((b) => {
      if (b.status === "cancelled") {
        ca.push(b);
      } else {
        const outDate = parseISO(b.check_out);
        if (isBefore(outDate, today) || b.status === "completed") {
          pa.push(b);
        } else {
          up.push(b);
        }
      }
    });

    return { upcoming: up, past: pa, cancelled: ca };
  }, [bookings, today]);

  // Handle cancellation
  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);

    try {
      await api.bookings.cancel(bookingToCancel.id);
      toast.success("Reservation cancelled successfully");
      setBookingToCancel(null);
      await fetchBookings();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.detail);
      } else {
        toast.error("Failed to cancel reservation");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const currentList =
    activeTab === "upcoming" ? upcoming : activeTab === "past" ? past : cancelled;

  return (
    <div className="py-8 sm:py-12 min-h-screen bg-white">
      <Container>
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">Trips</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage your upcoming adventures, past stays, and reservations.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 mb-8 space-x-8 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`pb-3 flex items-center gap-2 relative transition-colors ${
              activeTab === "upcoming"
                ? "text-[#222222]"
                : "text-neutral-500 hover:text-[#222222]"
            }`}
          >
            <span>Upcoming</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-700">
              {upcoming.length}
            </span>
            {activeTab === "upcoming" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#222222]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`pb-3 flex items-center gap-2 relative transition-colors ${
              activeTab === "past"
                ? "text-[#222222]"
                : "text-neutral-500 hover:text-[#222222]"
            }`}
          >
            <span>Past stays</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-700">
              {past.length}
            </span>
            {activeTab === "past" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#222222]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`pb-3 flex items-center gap-2 relative transition-colors ${
              activeTab === "cancelled"
                ? "text-[#222222]"
                : "text-neutral-500 hover:text-[#222222]"
            }`}
          >
            <span>Cancelled</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-700">
              {cancelled.length}
            </span>
            {activeTab === "cancelled" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#222222]" />
            )}
          </button>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-neutral-100 animate-pulse border border-neutral-200"
              />
            ))}
          </div>
        )}

        {/* Empty States */}
        {!isLoading && currentList.length === 0 && (
          <div className="py-16 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
              <Luggage className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-[#222222]">
              {activeTab === "upcoming"
                ? "No trips booked... yet!"
                : activeTab === "past"
                ? "No past trips"
                : "No cancelled reservations"}
            </h3>

            <p className="text-sm text-neutral-500 leading-relaxed">
              {activeTab === "upcoming"
                ? "Time to dust off your bags and start planning your next getaway. Explore stays around the world."
                : activeTab === "past"
                ? "When your trips conclude, your completed getaways and reviews will show up here."
                : "Any cancelled bookings will be saved here for your records."}
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#222222] text-white text-sm font-semibold hover:bg-black transition-colors"
            >
              <span>Start searching</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Booking Cards Grid */}
        {!isLoading && currentList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentList.map((trip) => {
              const inDate = parseISO(trip.check_in);
              const outDate = parseISO(trip.check_out);
              const nights = differenceInCalendarDays(outDate, inDate);
              const guestsCount = trip.guests_adults + trip.guests_children;
              const hasReviewed = reviewedBookingIds.has(trip.id);

              return (
                <div
                  key={trip.id}
                  className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-48 h-44 sm:h-auto bg-neutral-100 shrink-0">
                      <Image
                        src={
                          trip.listing?.cover_image ||
                          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600"
                        }
                        alt={trip.listing?.title || "Listing image"}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                              trip.status === "confirmed"
                                ? "bg-emerald-50 text-emerald-700"
                                : trip.status === "cancelled"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {trip.status}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {trip.code}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-[#222222] line-clamp-1">
                          {trip.listing?.title || "Stay"}
                        </h3>

                        <p className="text-xs text-neutral-500 mt-0.5">
                          {trip.listing?.city}, {trip.listing?.country}
                        </p>
                      </div>

                      <div className="space-y-1 text-xs text-neutral-600">
                        <div className="flex items-center gap-1.5 font-medium text-[#222222]">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>
                            {format(inDate, "MMM d")} – {format(outDate, "MMM d, yyyy")} ({nights} nights)
                          </span>
                        </div>
                        <p className="text-neutral-500">
                          {guestsCount} guest{guestsCount !== 1 ? "s" : ""} &bull; Total:{" "}
                          <strong className="text-[#222222] font-semibold">
                            {formatPrice(trip.total_price)}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-3 flex-wrap">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="text-xs font-semibold text-neutral-700 hover:text-black underline flex items-center gap-1"
                    >
                      <span>View details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <div className="flex items-center gap-2">
                      {activeTab === "upcoming" && (
                        <button
                          type="button"
                          onClick={() => setBookingToCancel(trip)}
                          className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                        >
                          Cancel booking
                        </button>
                      )}

                      {activeTab === "past" && (
                        <button
                          type="button"
                          onClick={() => setBookingToReview(trip)}
                          disabled={hasReviewed}
                          className="px-3 py-1.5 rounded-lg bg-[#222222] text-white text-xs font-semibold hover:bg-black transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-white" />
                          <span>{hasReviewed ? "Reviewed" : "Leave a review"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Cancel Confirmation Modal ── */}
        <Modal
          isOpen={Boolean(bookingToCancel)}
          onClose={() => setBookingToCancel(null)}
          title="Cancel Reservation"
          maxWidth="sm"
        >
          {bookingToCancel && (
            <div className="p-4 space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  Are you sure you want to cancel your stay at{" "}
                  <strong>{bookingToCancel.listing?.title}</strong>? These dates will be
                  immediately reopened for other travellers.
                </p>
              </div>

              <div className="text-xs text-neutral-600 space-y-1">
                <p>
                  <strong>Check-in:</strong> {formatDate(bookingToCancel.check_in)}
                </p>
                <p>
                  <strong>Checkout:</strong> {formatDate(bookingToCancel.check_out)}
                </p>
                <p>
                  <strong>Total Refund Amount:</strong> {formatPrice(bookingToCancel.total_price)}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setBookingToCancel(null)}
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-[#222222] hover:bg-neutral-50"
                >
                  Keep reservation
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isCancelling ? "Cancelling..." : "Confirm cancellation"}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ── Review Submission Modal ── */}
        {bookingToReview && (
          <ReviewModal
            isOpen={Boolean(bookingToReview)}
            onClose={() => setBookingToReview(null)}
            listingId={bookingToReview.listing_id}
            listingTitle={bookingToReview.listing?.title || "Stay"}
            bookingId={bookingToReview.id}
            onSuccess={() => {
              setReviewedBookingIds((prev) => new Set([...prev, bookingToReview.id]));
              setBookingToReview(null);
            }}
          />
        )}
      </Container>
    </div>
  );
}
