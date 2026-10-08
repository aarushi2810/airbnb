import React from "react";
import Link from "next/link";
import { Container } from "../components/layout/Container";
import { Compass, Home, Heart, Luggage, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="py-20 flex-1 flex items-center">
      <Container>
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center mx-auto shadow-sm">
            <Compass className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold tracking-widest text-[#FF385C] uppercase">
              Error 404
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#222222]">
              We can&apos;t seem to find the page you&apos;re looking for
            </h1>
            <p className="text-sm text-[#717171] max-w-md mx-auto">
              Here are some helpful links instead to get your journey back on track:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
            <Link
              href="/"
              className="p-4 rounded-2xl border border-neutral-200 hover:border-[#222222] transition-colors group flex flex-col justify-between"
            >
              <Home className="w-5 h-5 text-[#FF385C] mb-2" />
              <div>
                <div className="font-semibold text-xs text-[#222222] group-hover:underline">
                  Explore Stays
                </div>
                <div className="text-[11px] text-[#717171]">Discover unique homes</div>
              </div>
            </Link>

            <Link
              href="/trips"
              className="p-4 rounded-2xl border border-neutral-200 hover:border-[#222222] transition-colors group flex flex-col justify-between"
            >
              <Luggage className="w-5 h-5 text-blue-600 mb-2" />
              <div>
                <div className="font-semibold text-xs text-[#222222] group-hover:underline">
                  My Trips
                </div>
                <div className="text-[11px] text-[#717171]">View your reservations</div>
              </div>
            </Link>

            <Link
              href="/wishlists"
              className="p-4 rounded-2xl border border-neutral-200 hover:border-[#222222] transition-colors group flex flex-col justify-between"
            >
              <Heart className="w-5 h-5 text-rose-500 mb-2" />
              <div>
                <div className="font-semibold text-xs text-[#222222] group-hover:underline">
                  Wishlists
                </div>
                <div className="text-[11px] text-[#717171]">Saved favorites</div>
              </div>
            </Link>
          </div>

          <div className="pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#222222] text-white text-xs font-semibold hover:bg-black transition-colors"
            >
              Back to Home <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
