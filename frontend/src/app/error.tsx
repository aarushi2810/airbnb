"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Container } from "../components/layout/Container";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error caught by error boundary:", error);
  }, [error]);

  return (
    <div className="py-24 flex-1 flex items-center">
      <Container>
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222]">
              Something went wrong
            </h1>
            <p className="text-xs text-[#717171] leading-relaxed">
              We encountered an unexpected issue while loading this view. You can try refreshing the section or return home.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#222222] text-white text-xs font-semibold hover:bg-black transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-300 text-[#222222] text-xs font-semibold hover:bg-neutral-50 transition-colors"
            >
              <Home className="w-3.5 h-3.5" /> Go home
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
