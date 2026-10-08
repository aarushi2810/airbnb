"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "../../components/layout/Container";
import { ArrowLeft, Sparkles, Globe, User, HelpCircle, MessageSquare, Compass } from "lucide-react";

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const feature = searchParams.get("feature") || "general";

  const FEATURE_TITLES: Record<string, { title: string; desc: string; icon: React.ElementType }> = {
    experiences: {
      title: "Airbnb Experiences",
      desc: "Immersive activities led by passionate locals — from cooking classes and food tours to guided wilderness treks and cultural immersions.",
      icon: Sparkles,
    },
    globe: {
      title: "Language & Currency Preferences",
      desc: "Multi-region localization, international currency conversions, and translation tools.",
      icon: Globe,
    },
    account: {
      title: "Account & Profile Settings",
      desc: "Manage your login methods, payout preferences, security keys, and global account settings.",
      icon: User,
    },
    help: {
      title: "Help & Support Centre",
      desc: "Browse our comprehensive knowledge base, safety policies, AirCover claims, and cancellation support.",
      icon: HelpCircle,
    },
    messages: {
      title: "Messages & Inquiries",
      desc: "Direct messaging thread between guests and hosts for reservation coordination.",
      icon: MessageSquare,
    },
  };

  const currentMeta = FEATURE_TITLES[feature] || {
    title: "Feature Coming Soon",
    desc: "This capability is scheduled for upcoming phases in our comprehensive Airbnb clone architecture.",
    icon: Compass,
  };

  const IconComponent = currentMeta.icon;

  return (
    <div className="py-16">
      <Container>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#717171] hover:text-[#222222] mb-8 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to explore homes
        </Link>

        <div className="max-w-xl mx-auto p-10 rounded-3xl border border-neutral-200 bg-white shadow-card text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center mx-auto mb-6 shadow-xs">
            <IconComponent className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold text-[#222222] mb-3">
            {currentMeta.title}
          </h1>

          <p className="text-sm text-[#717171] leading-relaxed mb-8">
            {currentMeta.desc}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#222222] text-white text-xs font-semibold hover:bg-black transition-colors"
            >
              Explore Homes
            </Link>
            <Link
              href="/trips"
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-neutral-300 text-[#222222] text-xs font-semibold hover:border-black transition-colors"
            >
              View My Trips
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ComingSoonContent />
    </Suspense>
  );
}
