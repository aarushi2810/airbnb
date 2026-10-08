"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { SearchPill } from "../search/SearchPill";
import { Avatar } from "../ui/Avatar";
import { ComingSoonModal } from "../ui/ComingSoonModal";
import {
  Menu,
  Globe,
  Sparkles,
  Luggage,
  Heart,
  LayoutDashboard,
  Plus,
  Home,
  UserCheck,
  HelpCircle,
  Settings,
} from "lucide-react";
import { cn } from "../../lib/utils";

export function Header() {
  const router = useRouter();
  const {
    currentUser,
    isHostMode,
    toggleHostMode,
    openLoginModal,
  } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"stays" | "experiences">("stays");
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTabChange = (tab: "stays" | "experiences") => {
    setActiveTab(tab);
    if (tab === "experiences") {
      router.push("/coming-soon?feature=experiences");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#DDDDDD] transition-all">
        <div className="airbnb-container">
          {/* Top Header Row */}
          <div className="flex h-20 items-center justify-between gap-4">
            {/* ── Left: Airbnb Logo ────────────────────────────────────────── */}
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center gap-2 group select-none">
                <svg
                  viewBox="0 0 32 32"
                  className="w-8 h-8 fill-[#FF385C] transition-transform group-hover:scale-105"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.378c0 4.298-3.322 7.743-7.5 7.743-2.584 0-4.887-1.32-6.246-3.355l-.754-1.238-.754 1.238c-1.359 2.035-3.662 3.355-6.246 3.355-4.178 0-7.5-3.445-7.5-7.743 0-1.282.355-2.53 1.037-3.904l.184-.363c1.049-2.38 5.17-10.978 7.078-14.773l.542-1.042c1.295-2.32 2.755-3.284 4.752-3.284zm0 2c-1.314 0-2.35.635-3.42 2.547l-.547 1.054C10.076 10.518 6.002 19.006 4.93 21.439l-.158.312C4.205 22.923 3.9 23.957 3.9 24.879 3.9 27.971 6.275 30 9.5 30c2.08 0 3.96-1.121 5.06-2.929l.718-1.237.722 1.237C17.099 28.879 18.98 30 21.06 30c3.225 0 5.6-2.029 5.6-5.121 0-.749-.2-1.572-.705-2.779l-.133-.314c-1.02-2.35-5.132-10.957-7.054-14.729l-.538-1.036C17.151 3.618 16.115 3 14.8 3h1.2zM16 11.5c2.485 0 4.5 2.015 4.5 4.5 0 2.927-1.895 5.703-4.116 7.747l-.384.343-.384-.343C13.395 21.703 11.5 18.927 11.5 16c0-2.485 2.015-4.5 4.5-4.5zm0 2c-1.381 0-2.5 1.119-2.5 2.5 0 1.95 1.343 4.095 3 5.696 1.657-1.601 3-3.746 3-5.696 0-1.381-1.119-2.5-2.5-2.5z" />
                </svg>
                <span className="font-bold text-xl tracking-tighter text-[#FF385C] hidden sm:inline">
                  airbnb
                </span>
              </Link>
            </div>

            {/* ── Center: Search Bar & Tabs ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl px-2">
              {/* Stays / Experiences Top Tabs */}
              <div className="hidden md:flex items-center gap-6 mb-2">
                <button
                  type="button"
                  onClick={() => handleTabChange("stays")}
                  className={cn(
                    "text-sm font-semibold transition-colors relative py-1",
                    activeTab === "stays"
                      ? "text-[#222222]"
                      : "text-[#717171] hover:text-[#222222]"
                  )}
                >
                  Stays
                  {activeTab === "stays" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#222222] rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("experiences")}
                  className={cn(
                    "text-sm font-semibold transition-colors relative py-1 flex items-center gap-1",
                    activeTab === "experiences"
                      ? "text-[#222222]"
                      : "text-[#717171] hover:text-[#222222]"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FF385C]" />
                  Experiences
                  {activeTab === "experiences" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#222222] rounded-full" />
                  )}
                </button>
              </div>

              {/* Integrated Search Pill */}
              <SearchPill />
            </div>

            {/* ── Right: User Actions & Navigation ─────────────────────────── */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Airbnb your home link / Host Mode Toggle */}
              <button
                type="button"
                onClick={toggleHostMode}
                className="hidden lg:inline-flex text-xs font-semibold text-[#222222] hover:bg-neutral-100 py-2.5 px-3.5 rounded-full transition-colors"
              >
                {isHostMode ? "Switch to traveling" : "Airbnb your home"}
              </button>

              {/* Globe Icon */}
              <button
                type="button"
                onClick={() => setComingSoonFeature("globe")}
                className="p-2.5 rounded-full hover:bg-neutral-100 text-[#222222] transition-colors"
                aria-label="Language and currency"
              >
                <Globe className="w-4 h-4" />
              </button>

              {/* User Menu Pill & Dropdown */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 p-1.5 pl-3 rounded-full border border-[#DDDDDD] hover:shadow-md transition-all bg-white"
                  aria-label="User navigation menu"
                >
                  <Menu className="w-4 h-4 text-[#222222]" />
                  <Avatar
                    src={currentUser?.avatar_url}
                    alt={currentUser?.name || "User"}
                    size="sm"
                    isSuperhost={currentUser?.is_superhost}
                  />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white border border-neutral-200/80 shadow-dropdown overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 py-2 divide-y divide-neutral-100 text-xs">
                    {/* User Profile Header */}
                    <div className="px-4 py-2.5">
                      <div className="font-semibold text-sm text-[#222222] truncate">
                        {currentUser ? currentUser.name : "Guest Mode"}
                      </div>
                      <div className="text-[11px] text-[#717171] truncate">
                        {currentUser ? currentUser.email : "Not signed in"}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-700 capitalize">
                        {isHostMode ? "Host Mode Active" : "Traveling Mode"}
                      </div>
                    </div>

                    {/* Guest Mode Options */}
                    {!isHostMode ? (
                      <div className="py-1">
                        <Link
                          href="/trips"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 font-semibold text-[#222222] hover:bg-neutral-50 transition-colors"
                        >
                          <Luggage className="w-4 h-4 text-neutral-500" />
                          <span>Trips</span>
                        </Link>

                        <Link
                          href="/wishlists"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 font-semibold text-[#222222] hover:bg-neutral-50 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-neutral-500" />
                          <span>Wishlists</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            toggleHostMode();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 font-medium text-[#222222] hover:bg-neutral-50 transition-colors text-left"
                        >
                          <Home className="w-4 h-4 text-neutral-500" />
                          <span>Switch to hosting</span>
                        </button>
                      </div>
                    ) : (
                      /* Host Mode Options */
                      <div className="py-1">
                        <Link
                          href="/host/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 font-semibold text-[#222222] hover:bg-neutral-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-neutral-500" />
                          <span>Dashboard</span>
                        </Link>

                        <Link
                          href="/host/listings/new"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 font-semibold text-[#222222] hover:bg-neutral-50 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-neutral-500" />
                          <span>Create a new listing</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            toggleHostMode();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 font-medium text-[#222222] hover:bg-neutral-50 transition-colors text-left"
                        >
                          <Luggage className="w-4 h-4 text-neutral-500" />
                          <span>Switch to traveling</span>
                        </button>
                      </div>
                    )}

                    {/* Secondary & Mock Auth Actions */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          openLoginModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 font-semibold text-[#FF385C] hover:bg-rose-50/50 transition-colors text-left"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Log in / Switch user</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setComingSoonFeature("account");
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-neutral-600 hover:bg-neutral-50 transition-colors text-left"
                      >
                        <Settings className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Account settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setComingSoonFeature("help");
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-neutral-600 hover:bg-neutral-50 transition-colors text-left"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Help Centre</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Coming Soon Modal for Secondary Links */}
      <ComingSoonModal
        isOpen={Boolean(comingSoonFeature)}
        onClose={() => setComingSoonFeature(null)}
        feature={comingSoonFeature || "experiences"}
      />
    </>
  );
}
