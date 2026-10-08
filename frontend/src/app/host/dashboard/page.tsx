"use client";

/**
 * HostDashboardPage
 *
 * Full-featured Airbnb Host Dashboard:
 *  - Route guard using useRequireHost.
 *  - Metric cards: Active listings, Upcoming reservations, Estimated earnings.
 *  - URL-synced tabs (?tab=listings vs ?tab=reservations).
 *  - Listings tab:
 *      - Table with thumbnail, title, location, status badge, price, and actions.
 *      - Activate / Deactivate toggle with instant state update.
 *      - Delete with confirmation dialog + 409 conflict handler (active bookings).
 *      - Direct link to "Create listing".
 *  - Reservations tab:
 *      - Filter chips (All, Upcoming, Past, Cancelled).
 *      - Guest details, dates, booking code chip, payout total.
 *      - Host cancellation modal with date release.
 *  - Guest friendly state: "Become a host" prompt for guest accounts.
 */

import React, { useState, useEffect, useCallback, Suspense, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Home,
  CalendarCheck,
  TrendingUp,
  Edit,
  Trash2,
  Power,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "../../../components/layout/Container";
import { Modal } from "../../../components/ui/Modal";
import { useRequireHost } from "../../../hooks/useRequireHost";
import { apiClient, ApiError } from "../../../lib/api";
import type {
  ListingDetail,
  Booking,
  HostDashboardMetrics,
} from "../../../types";

function HostDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "reservations" ? "reservations" : "listings";
  const [activeTab, setActiveTab] = useState<"listings" | "reservations">(initialTab);
  const [, startTransition] = useTransition();

  const { currentUser, isLoading: authLoading, isHost, openLoginModal } = useRequireHost();

  const [metrics, setMetrics] = useState<HostDashboardMetrics | null>(null);
  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingFilter, setBookingFilter] = useState<"all" | "upcoming" | "past" | "cancelled">("all");
  const [loadingData, setLoadingData] = useState(true);

  // Delete listing state
  const [listingToDelete, setListingToDelete] = useState<ListingDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConflictMessage, setDeleteConflictMessage] = useState<string | null>(null);

  // Host cancel reservation state
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Sync tab with URL
  const handleTabChange = (tab: "listings" | "reservations") => {
    setActiveTab(tab);
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", tab);
      router.replace(`/host/dashboard?${params.toString()}`);
    });
  };

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoadingData(true);
    try {
      const [dashMetrics, hostListings, hostBookings] = await Promise.all([
        apiClient.host.getDashboard().catch(() => null),
        apiClient.host.listListings().catch(() => []),
        apiClient.host.listBookings().catch(() => []),
      ]);

      setMetrics(dashMetrics);
      setListings(hostListings);
      setBookings(hostBookings);
    } catch (err) {
      console.error("Failed to load host dashboard data", err);
    } finally {
      setLoadingData(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  // Toggle active / inactive status
  const handleToggleStatus = async (listing: ListingDetail) => {
    const nextStatus = listing.status === "active" ? "inactive" : "active";
    try {
      const updated = await apiClient.host.updateListing(listing.id, { status: nextStatus });
      setListings((prev) => prev.map((l) => (l.id === listing.id ? updated : l)));
      toast.success(
        nextStatus === "active"
          ? "Listing activated and now visible in search"
          : "Listing deactivated and hidden from search"
      );
      // Refresh metrics
      apiClient.host.getDashboard().then(setMetrics).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      toast.error(msg);
    }
  };

  // Delete listing handler
  const confirmDeleteListing = async () => {
    if (!listingToDelete) return;
    setIsDeleting(true);
    setDeleteConflictMessage(null);
    try {
      await apiClient.host.deleteListing(listingToDelete.id);
      toast.success("Listing deleted successfully");
      setListings((prev) => prev.filter((l) => l.id !== listingToDelete.id));
      setListingToDelete(null);
      // Refresh metrics
      apiClient.host.getDashboard().then(setMetrics).catch(() => {});
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setDeleteConflictMessage(
          "Cannot delete this listing because it has upcoming confirmed reservations. Please cancel or honour those bookings, or deactivate the listing instead."
        );
      } else {
        const msg = err instanceof Error ? err.message : "Failed to delete listing";
        toast.error(msg);
        setListingToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Host cancel reservation handler
  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    try {
      const updated = await apiClient.bookings.cancel(bookingToCancel.id);
      toast.success("Reservation cancelled. Dates are reopened on calendar.");
      setBookings((prev) => prev.map((b) => (b.id === bookingToCancel.id ? updated : b)));
      setBookingToCancel(null);
      // Refresh metrics
      apiClient.host.getDashboard().then(setMetrics).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel booking";
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  // Filter bookings
  const today = new Date().toISOString().split("T")[0];
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "all") return true;
    if (bookingFilter === "cancelled") return b.status === "cancelled";
    if (bookingFilter === "upcoming") return b.status === "confirmed" && b.check_out >= today;
    if (bookingFilter === "past") return b.status === "completed" || (b.status === "confirmed" && b.check_out < today);
    return true;
  });

  if (authLoading) {
    return (
      <Container className="py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-28 bg-neutral-200 rounded-2xl" />
            <div className="h-28 bg-neutral-200 rounded-2xl" />
            <div className="h-28 bg-neutral-200 rounded-2xl" />
          </div>
        </div>
      </Container>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <Container className="py-20 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-[#222222]">Host Dashboard</h2>
          <p className="text-sm text-[#717171]">
            Please log in with a host account to manage your listings and reservations.
          </p>
          <button
            type="button"
            onClick={openLoginModal}
            className="px-6 py-2.5 rounded-full bg-[#FF385C] text-white text-sm font-semibold hover:bg-[#E31C5F] transition-colors"
          >
            Log in to continue
          </button>
        </div>
      </Container>
    );
  }

  // Logged in as Guest account
  if (!isHost) {
    return (
      <Container className="py-20 text-center">
        <div className="max-w-md mx-auto p-8 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center mx-auto">
            <Home className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-[#222222]">Become an Airbnb Host</h2>
          <p className="text-xs text-[#717171] leading-relaxed">
            You are logged in as <strong>{currentUser.name}</strong> (Guest). Switch to a host account to manage properties, or create your first listing to start hosting.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={openLoginModal}
              className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-semibold text-[#222222] hover:bg-neutral-100 transition-colors"
            >
              Switch User
            </button>
            <Link
              href="/host/listings/new"
              className="px-4 py-2 rounded-full bg-[#FF385C] text-white text-xs font-semibold hover:bg-[#E31C5F] transition-colors"
            >
              Create a Listing
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className="py-8 pb-20">
      <Container>
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-sm text-[#717171] mt-1">
              Manage your properties, review reservation performance, and create new stays.
            </p>
          </div>

          <Link
            href="/host/listings/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF385C] text-white text-sm font-semibold hover:bg-[#E31C5F] transition-all shadow-sm shrink-0 w-fit"
          >
            <Plus className="w-4 h-4" /> Create listing
          </Link>
        </div>

        {/* ── METRIC STATS ROW (3 Cards) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#717171] uppercase tracking-wider">
                Active Listings
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#222222] mt-1">
                {metrics ? metrics.active_listings : listings.filter((l) => l.status === "active").length}
              </div>
              <div className="text-[11px] text-[#717171] mt-0.5">
                out of {metrics ? metrics.total_listings : listings.length} total properties
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-[#FF385C] shrink-0">
              <Home className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#717171] uppercase tracking-wider">
                Upcoming Reservations
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#222222] mt-1">
                {metrics ? metrics.upcoming_reservations : bookings.filter((b) => b.status === "confirmed").length}
              </div>
              <div className="text-[11px] text-[#717171] mt-0.5">
                Confirmed upcoming guest stays
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#717171] uppercase tracking-wider">
                Estimated Earnings
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#222222] mt-1">
                ₹{metrics ? metrics.estimated_earnings.toLocaleString() : "0"}
              </div>
              <div className="text-[11px] text-[#717171] mt-0.5">
                (estimated host payouts after service fee)
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ── TABS NAVIGATION ── */}
        <div className="flex border-b border-neutral-200 mb-6 gap-6">
          <button
            type="button"
            onClick={() => handleTabChange("listings")}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === "listings"
                ? "text-[#222222]"
                : "text-[#717171] hover:text-[#222222]"
            }`}
          >
            My Listings ({listings.length})
            {activeTab === "listings" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#222222]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("reservations")}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === "reservations"
                ? "text-[#222222]"
                : "text-[#717171] hover:text-[#222222]"
            }`}
          >
            Reservations ({bookings.length})
            {activeTab === "reservations" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#222222]" />
            )}
          </button>
        </div>

        {/* ── TAB 1: MY LISTINGS ── */}
        {activeTab === "listings" && (
          <div>
            {loadingData ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 bg-neutral-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-neutral-200 bg-neutral-50">
                <Home className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-[#222222] mb-1">
                  You haven&apos;t listed any properties yet
                </h3>
                <p className="text-xs text-[#717171] max-w-sm mx-auto mb-4">
                  Start earning by sharing your home, villa, or apartment with guests from around the world.
                </p>
                <Link
                  href="/host/listings/new"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FF385C] text-white text-xs font-semibold hover:bg-[#E31C5F] transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create your first listing
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold text-[#717171] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Listing</th>
                      <th className="py-3.5 px-4">Location</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Nightly Price</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs text-[#222222]">
                    {listings.map((lst) => {
                      const cover = lst.images?.[0]?.url || "/placeholder-stay.jpg";
                      const isActive = lst.status === "active";
                      return (
                        <tr key={lst.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                                <Image
                                  src={cover}
                                  alt={lst.title}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </div>
                              <div className="min-w-0 max-w-xs">
                                <Link
                                  href={`/listings/${lst.id}`}
                                  className="font-semibold text-sm text-[#222222] hover:underline truncate block"
                                >
                                  {lst.title}
                                </Link>
                                <div className="text-[11px] text-[#717171]">
                                  {lst.room_type.replace("_", " ")} • {lst.max_guests} guests
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-[#717171]">
                            {lst.city}, {lst.country}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? "bg-emerald-500" : "bg-neutral-400"
                                }`}
                              />
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-semibold">
                            ₹{lst.price_per_night.toLocaleString()}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Link */}
                              <Link
                                href={`/listings/${lst.id}`}
                                title="View public page"
                                className="p-1.5 rounded-lg text-neutral-500 hover:text-[#222222] hover:bg-neutral-100 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>

                              {/* Edit Link */}
                              <Link
                                href={`/host/listings/${lst.id}/edit`}
                                title="Edit listing"
                                className="p-1.5 rounded-lg text-neutral-500 hover:text-[#222222] hover:bg-neutral-100 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>

                              {/* Toggle Active / Inactive */}
                              <button
                                type="button"
                                title={isActive ? "Deactivate listing" : "Activate listing"}
                                onClick={() => handleToggleStatus(lst)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isActive
                                    ? "text-emerald-600 hover:bg-emerald-50"
                                    : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                                }`}
                              >
                                <Power className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                title="Delete listing"
                                onClick={() => {
                                  setListingToDelete(lst);
                                  setDeleteConflictMessage(null);
                                }}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: RESERVATIONS ── */}
        {activeTab === "reservations" && (
          <div>
            {/* Filter Chips */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs">
              {(["all", "upcoming", "past", "cancelled"] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setBookingFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-full capitalize font-medium transition-colors ${
                    bookingFilter === filterKey
                      ? "bg-[#222222] text-white"
                      : "bg-neutral-100 text-[#717171] hover:bg-neutral-200 hover:text-[#222222]"
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>

            {loadingData ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 bg-neutral-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-neutral-200 bg-neutral-50">
                <CalendarCheck className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-[#222222] mb-1">
                  No reservations found
                </h3>
                <p className="text-xs text-[#717171] max-w-sm mx-auto">
                  {bookingFilter === "all"
                    ? "When guests reserve your properties, their details and schedule will appear here."
                    : `No ${bookingFilter} bookings in your dashboard.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold text-[#717171] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Guest</th>
                      <th className="py-3.5 px-4">Listing</th>
                      <th className="py-3.5 px-4">Dates</th>
                      <th className="py-3.5 px-4">Payout</th>
                      <th className="py-3.5 px-4">Code / Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs text-[#222222]">
                    {filteredBookings.map((b) => {
                      const guestName = b.guest?.name || "Guest";
                      const guestAvatar = b.guest?.avatar_url || "/placeholder-avatar.jpg";
                      const isConfirmed = b.status === "confirmed";
                      const isCancelled = b.status === "cancelled";
                      const hostPayout = b.total_price - b.service_fee;

                      return (
                        <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-neutral-200 shrink-0">
                                <Image
                                  src={guestAvatar}
                                  alt={guestName}
                                  fill
                                  className="object-cover"
                                  sizes="32px"
                                />
                              </div>
                              <div>
                                <div className="font-semibold text-[#222222]">{guestName}</div>
                                <div className="text-[11px] text-[#717171]">
                                  {b.guests_adults + (b.guests_children || 0)} guests
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-[#222222] truncate max-w-[200px]">
                              {b.listing?.title || `Listing #${b.listing_id}`}
                            </div>
                            <div className="text-[11px] text-[#717171]">
                              {b.listing?.city}, {b.listing?.country}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-[#222222]">
                              {b.check_in} → {b.check_out}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-[#222222]">
                              ₹{hostPayout.toLocaleString()}
                            </div>
                            <div className="text-[11px] text-[#717171]">
                              (₹{b.total_price.toLocaleString()} total)
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                                {b.code}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                  isConfirmed
                                    ? "bg-emerald-50 text-emerald-700"
                                    : isCancelled
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-neutral-100 text-neutral-600"
                                }`}
                              >
                                {b.status}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isConfirmed ? (
                              <button
                                type="button"
                                onClick={() => setBookingToCancel(b)}
                                className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline"
                              >
                                Cancel
                              </button>
                            ) : (
                              <span className="text-[11px] text-neutral-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── DELETE LISTING MODAL ── */}
        <Modal
          isOpen={Boolean(listingToDelete)}
          onClose={() => {
            if (!isDeleting) {
              setListingToDelete(null);
              setDeleteConflictMessage(null);
            }
          }}
          title="Delete Listing"
        >
          <div className="space-y-4">
            {deleteConflictMessage ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Upcoming Reservations Protection
                </div>
                <p>{deleteConflictMessage}</p>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (listingToDelete) {
                        handleToggleStatus(listingToDelete);
                      }
                      setListingToDelete(null);
                      setDeleteConflictMessage(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold text-xs hover:bg-black"
                  >
                    Deactivate Instead
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setListingToDelete(null);
                      setDeleteConflictMessage(null);
                      handleTabChange("reservations");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-neutral-300 font-semibold text-xs hover:bg-neutral-100"
                  >
                    View Reservations
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#717171]">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-[#222222] font-semibold">
                    &ldquo;{listingToDelete?.title}&rdquo;
                  </strong>
                  ? This action cannot be undone.
                </p>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setListingToDelete(null)}
                    className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-semibold text-[#222222] hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={confirmDeleteListing}
                    className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete Permanently"}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* ── CANCEL RESERVATION MODAL ── */}
        <Modal
          isOpen={Boolean(bookingToCancel)}
          onClose={() => {
            if (!isCancelling) setBookingToCancel(null);
          }}
          title="Cancel Reservation"
        >
          <div className="space-y-4">
            <p className="text-xs text-[#717171]">
              Are you sure you want to cancel reservation{" "}
              <strong className="text-[#222222] font-mono">{bookingToCancel?.code}</strong> for{" "}
              <strong className="text-[#222222]">
                {bookingToCancel?.guest?.name || "Guest"}
              </strong>
              ? The dates ({bookingToCancel?.check_in} to {bookingToCancel?.check_out}) will be
              reopened for new guests immediately.
            </p>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setBookingToCancel(null)}
                className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-semibold text-[#222222] hover:bg-neutral-100"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={confirmCancelBooking}
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </Modal>
      </Container>
    </div>
  );
}

export default function HostDashboardPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-1/4" />
            <div className="h-40 bg-neutral-200 rounded-2xl" />
          </div>
        </Container>
      }
    >
      <HostDashboardContent />
    </Suspense>
  );
}
