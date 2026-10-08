"use client";

/**
 * /trips/[bookingId]/page.tsx
 *
 * Booking Confirmation & Details View:
 *  - Displays reservation confirmed success banner (?confirmed=1).
 *  - Copyable reservation code chip with clipboard toast.
 *  - Trip summary: Dates, times, guests, host info, address.
 *  - Itemized price breakdown.
 *  - Direct links to "View my trips" (/trips) and "Keep exploring" (/).
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { Container } from "../../../components/layout/Container";
import { api, ApiError } from "../../../lib/api";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { formatPrice } from "../../../lib/utils";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import type { Booking } from "../../../types";

export default function TripDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = Number(params?.bookingId);
  const isConfirmed = searchParams.get("confirmed") === "1";

  useRequireAuth({ triggerModal: true });

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || isNaN(bookingId)) {
      setError("Invalid booking ID");
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    api.bookings
      .getById(bookingId)
      .then((data) => {
        if (!isMounted) return;
        setBooking(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof ApiError && err.status === 404) {
          setError("Reservation not found");
        } else {
          setError("Failed to load booking details");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const copyCode = () => {
    if (booking?.code) {
      navigator.clipboard.writeText(booking.code);
      toast.success("Reservation code copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 animate-pulse">
        <Container>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="h-10 w-48 bg-neutral-200 rounded-xl mx-auto" />
            <div className="h-64 bg-neutral-100 rounded-2xl" />
          </div>
        </Container>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="py-20 text-center">
        <Container>
          <div className="max-w-md mx-auto p-8 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-4">
            <h2 className="text-xl font-bold text-[#222222]">{error || "Reservation not found"}</h2>
            <p className="text-sm text-neutral-500">
              The booking reference does not exist or you do not have permission to view it.
            </p>
            <Link
              href="/trips"
              className="inline-block px-6 py-2.5 rounded-xl bg-[#222222] text-white text-sm font-semibold hover:bg-black"
            >
              Back to My Trips
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const checkInDate = parseISO(booking.check_in);
  const checkOutDate = parseISO(booking.check_out);
  const nights = differenceInCalendarDays(checkOutDate, checkInDate);
  const totalGuests = booking.guests_adults + booking.guests_children;

  return (
    <div className="py-8 sm:py-12 min-h-screen bg-neutral-50/50">
      <Container>
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Success Banner if redirected from booking */}
          {isConfirmed && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl flex items-center justify-between gap-6 flex-wrap animate-in fade-in duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Reservation confirmed!</h1>
                  <p className="text-xs text-white/90 mt-0.5">
                    You&apos;re all set for your upcoming adventure. Check your confirmation code below.
                  </p>
                </div>
              </div>

              {/* Copyable Code Chip */}
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-mono font-bold tracking-wider transition-colors"
                title="Click to copy code"
              >
                <span>{booking.code}</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main Booking Card */}
          <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden divide-y divide-neutral-200">
            {/* Top Overview */}
            <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start">
              {/* Image */}
              <div className="relative w-full md:w-56 h-40 rounded-2xl overflow-hidden bg-neutral-100 shrink-0">
                <Image
                  src={
                    booking.listing?.cover_image ||
                    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600"
                  }
                  alt={booking.listing?.title || "Listing photo"}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold capitalize">
                    {booking.status}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    Code: {booking.code}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-[#222222] line-clamp-2">
                  {booking.listing?.title || "Stay"}
                </h2>

                <p className="text-sm text-neutral-600 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>
                    {booking.listing?.city}, {booking.listing?.country}
                  </span>
                </p>
              </div>
            </div>

            {/* Dates & Times Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-neutral-50/50">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Check-in
                </span>
                <p className="text-base font-bold text-[#222222]">
                  {format(checkInDate, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Check-in after 3:00 PM
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Checkout
                </span>
                <p className="text-base font-bold text-[#222222]">
                  {format(checkOutDate, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Checkout before 11:00 AM
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Guests
                </span>
                <p className="text-sm font-semibold text-[#222222]">
                  {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Duration
                </span>
                <p className="text-sm font-semibold text-[#222222]">
                  {nights} night{nights !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Price Paid Breakdown */}
            <div className="p-6 sm:p-8 space-y-3">
              <h3 className="font-bold text-base text-[#222222]">Payment details</h3>
              <div className="space-y-2 text-sm text-neutral-700">
                <div className="flex justify-between">
                  <span>
                    {formatPrice(booking.nightly_rate)} x {nights} nights
                  </span>
                  <span>{formatPrice(booking.nightly_rate * nights)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cleaning fee</span>
                  <span>{formatPrice(booking.cleaning_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Airbnb service fee</span>
                  <span>{formatPrice(booking.service_fee)}</span>
                </div>
                <div className="border-t border-neutral-200 pt-3 flex justify-between font-bold text-base text-[#222222]">
                  <span>Total paid</span>
                  <span>{formatPrice(booking.total_price)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
            <Link
              href="/trips"
              className="px-6 py-3 rounded-xl bg-[#222222] text-white font-semibold text-sm hover:bg-black transition-colors"
            >
              View my trips
            </Link>

            <Link
              href="/"
              className="px-6 py-3 rounded-xl border border-neutral-300 font-semibold text-sm text-[#222222] hover:bg-neutral-50 transition-colors inline-flex items-center gap-2"
            >
              <span>Keep exploring</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
