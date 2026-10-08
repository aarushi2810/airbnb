"use client";

import React from "react";
import { Modal } from "./Modal";
import { Compass, Sparkles, Globe, User, HelpCircle, MessageSquare } from "lucide-react";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: "experiences" | "globe" | "account" | "help" | "messages" | string;
}

const FEATURE_METADATA: Record<string, { title: string; desc: string; icon: React.ElementType }> = {
  experiences: {
    title: "Airbnb Experiences",
    desc: "One-of-a-kind activities hosted by local experts — from cooking classes to guided wilderness treks.",
    icon: Sparkles,
  },
  globe: {
    title: "Language & Currency",
    desc: "Multi-region localization, currency convertibility, and language preferences.",
    icon: Globe,
  },
  account: {
    title: "Account & Security Settings",
    desc: "Personal information, login security, payment methods, and global preferences.",
    icon: User,
  },
  help: {
    title: "Help & Support Center",
    desc: "24/7 guest support, safety guidelines, and AirCover protection policies.",
    icon: HelpCircle,
  },
  messages: {
    title: "Host & Guest Messages",
    desc: "Real-time chat threads between guests and hosts regarding reservation logistics.",
    icon: MessageSquare,
  },
};

export function ComingSoonModal({
  isOpen,
  onClose,
  feature = "experiences",
}: ComingSoonModalProps) {
  const meta = FEATURE_METADATA[feature] || {
    title: "Coming Soon",
    desc: "This feature is currently under active development as part of the Airbnb take-home roadmap.",
    icon: Compass,
  };

  const IconComponent = meta.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={meta.title} maxWidth="sm">
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center mx-auto mb-4">
          <IconComponent className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-[#222222] mb-2">{meta.title}</h3>
        <p className="text-xs text-[#717171] leading-relaxed mb-6">
          {meta.desc}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#222222] text-white text-xs font-semibold hover:bg-black transition-colors"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}
