"use client";

import Link from "next/link";
import { Heart, Gamepad2, Gift, Wallet, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import StickyNote, { type StickyNoteData } from "@/components/home/StickyNote";
import SiteLogo from "@/components/ui/SiteLogo";

interface HomeClientProps {
  logoUrl?: string | null;
  displayName: string;
  initialStickyNote?: StickyNoteData | null;
}

const featureCards = [
  {
    title: "Find Your Match",
    description: "Meet new people from across the community and start conversations.",
    href: "/match",
    icon: Heart,
    accent: "from-berry to-grape",
  },
  {
    title: "Activities",
    description: "Join live activities and win exciting products with your tickets.",
    href: "/activities/airborne-activities",
    icon: Gamepad2,
    accent: "from-primary to-accent",
  },
  {
    title: "Gift Store",
    description: "Send a gift to someone special and brighten their day.",
    href: "/gifts",
    icon: Gift,
    accent: "from-amber-500 to-rose-500",
  },
  {
    title: "Wallet & Recharge",
    description: "Add balance, track transactions and withdraw your earnings.",
    href: "/mine",
    icon: Wallet,
    accent: "from-emerald-500 to-teal-500",
  },
];

export default function HomeClient({
  logoUrl,
  displayName,
  initialStickyNote,
}: HomeClientProps) {
  return (
    <div className="pb-8">
      <StickyNote initialNote={initialStickyNote} />

      <div className="px-4 pt-5">
        <div className="relative overflow-hidden rounded-3xl gradient-primary text-white p-5 sm:p-6">
          <Sparkles
            size={120}
            className="absolute -right-6 -top-6 text-white/10 rotate-12"
            strokeWidth={1.5}
          />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <SiteLogo url={logoUrl} size={48} className="rounded-2xl" />
              <div>
                <p className="text-[11px] font-medium opacity-80">
                  Welcome{displayName ? `, ${displayName}` : ""}
                </p>
                <h1 className="text-xl font-bold leading-tight">Love is in the air</h1>
              </div>
            </div>
            <p className="text-sm leading-relaxed opacity-90 max-w-md">
              Discover new connections, join fun activities and send gifts right from your
              phone. Your perfect moments are waiting here.
            </p>
            <Link
              href="/match"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
            >
              <Heart size={16} className="fill-primary" /> Explore Profiles
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-primary" /> Explore Love e Birds
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3.5 active:scale-[0.99] transition-all"
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{card.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors"
                />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-6">
        <Link
          href="/mine/verification"
          className="flex items-center gap-3.5 rounded-2xl border border-dashed border-primary/40 p-4 active:scale-[0.99] transition-all"
        >
          <ShieldCheck size={20} className="text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary">Get Verified</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verify your profile to unlock a verified badge and build trust.
            </p>
          </div>
          <ArrowRight size={16} className="text-primary flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}