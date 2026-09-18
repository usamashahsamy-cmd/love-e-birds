"use client";

import { useMemo, useState, useTransition } from "react";
import { Sparkles, HeartCrack } from "lucide-react";
import MatchCard from "./MatchCard";
import { toast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { unmatchProfile } from "@/actions/social";
import type { MatchItem } from "@/lib/matches";

type Filter = "all" | "online";

export default function MatchList({ matches }: { matches: MatchItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [unmatching, setUnmatching] = useState<MatchItem | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (filter === "online" ? matches.filter((m) => m.target.isOnline) : matches),
    [matches, filter]
  );

  const newThisWeek = filtered.filter((m) => m.isNewThisWeek);
  const rest = filtered.filter((m) => !m.isNewThisWeek);

  function handleUnmatch() {
    if (!unmatching || pending) return;
    const match = unmatching;
    setUnmatching(null);
    startTransition(async () => {
      const res = await unmatchProfile(match.target.id);
      if (res.success) {
        toast(`Unmatched with ${match.target.displayName}`);
      } else {
        toast(res.error || "Failed to unmatch", "error");
      }
    });
  }

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: matches.length },
    { key: "online", label: "Online", count: matches.filter((m) => m.target.isOnline).length },
  ];

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={HeartCrack}
        title="No matches yet"
        description="Like profiles and when they like you back, you'll see them here."
      />
    );
  }

  return (
    <div>
      <div className="flex gap-2 px-4 pt-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === tab.key
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            }`}
          >
            {tab.label}{" "}
            <span className={`ml-0.5 ${filter === tab.key ? "text-white/80" : "text-muted-foreground"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No one online right now"
          description="Check back in a bit, or switch to see all matches."
        />
      ) : (
        <>
          {newThisWeek.length > 0 && (
            <section className="pt-3">
              <div className="flex items-center gap-1.5 px-4 mb-2">
                <Sparkles size={14} className="text-accent" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  New This Week
                </h2>
                <span className="text-[10px] bg-accent/10 text-accent-dark rounded-full px-1.5 py-0.5 font-semibold">
                  {newThisWeek.length}
                </span>
              </div>
              <div className="px-4 space-y-2.5">
                {newThisWeek.map((m) => (
                  <MatchCard
                    key={m.matchId}
                    {...m.target}
                    onUnmatch={() => setUnmatching(m)}
                  />
                ))}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section className="pt-3">
              <div className="flex items-center gap-1.5 px-4 mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  All Matches
                </h2>
                <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5 font-semibold text-muted-foreground">
                  {rest.length}
                </span>
              </div>
              <div className="px-4 space-y-2.5 pb-2">
                {rest.map((m) => (
                  <MatchCard key={m.matchId} {...m.target} onUnmatch={() => setUnmatching(m)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Modal
        open={!!unmatching}
        onClose={() => setUnmatching(null)}
        title="Unmatch?"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You won&apos;t see @{unmatching?.target.username} in your matches anymore. This
            can&apos;t be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setUnmatching(null)}
              className="flex-1 py-2.5 rounded-lg border border-card-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Keep Match
            </button>
            <button
              onClick={handleUnmatch}
              className="flex-1 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Unmatch
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}