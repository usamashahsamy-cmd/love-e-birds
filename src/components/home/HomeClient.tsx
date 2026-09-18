"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BannerCarousel from "@/components/ui/BannerCarousel";
import CategoryTabs, { type Category } from "@/components/home/CategoryTabs";
import ProfileGrid from "@/components/discovery/ProfileGrid";
import StickyNote, { type StickyNoteData } from "@/components/home/StickyNote";
import FeaturedUsers from "@/components/home/FeaturedUsers";
import type { DiscoverProfile } from "@/lib/discover";
import { AlertCircle, RefreshCw } from "lucide-react";

interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
}

interface HomeClientProps {
  banners: BannerItem[];
  categories: Category[];
  initialProfiles: DiscoverProfile[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  initialCategory: string;
  initialStickyNote?: StickyNoteData | null;
  initialFeaturedUsers?: { id: string; username: string; displayName: string; avatar: string | null }[];
}

export default function HomeClient({
  banners,
  categories,
  initialProfiles,
  initialNextCursor,
  initialHasMore,
  initialCategory,
  initialStickyNote,
  initialFeaturedUsers,
}: HomeClientProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestSeq = useRef(0);

  const loadProfiles = useCallback(async (category: string, cursor: string | null, append: boolean) => {
    const seq = ++requestSeq.current;
    if (!append) {
      setInitialLoading(true);
      setProfiles([]);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const params = new URLSearchParams({ category, limit: "8" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/discover?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch");
      if (seq !== requestSeq.current) return;

      setProfiles((prev) => (append ? [...prev, ...json.data] : json.data));
      setNextCursor(json.nextCursor);
      setHasMore(json.hasMore);
    } catch {
      if (seq === requestSeq.current) setError("Something went wrong. Please try again.");
    } finally {
      if (seq === requestSeq.current) {
        setInitialLoading(false);
        setLoading(false);
      }
    }
  }, []);

  function handleCategoryChange(category: string) {
    if (category === activeCategory) return;
    setActiveCategory(category);
    loadProfiles(category, null, false);
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !error) {
          loadProfiles(activeCategory, nextCursor, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, nextCursor, loading, error, activeCategory, loadProfiles]);

  return (
    <div>
      <StickyNote initialNote={initialStickyNote} />
      <BannerCarousel banners={banners} />
      <FeaturedUsers users={initialFeaturedUsers ?? []} />
      <CategoryTabs categories={categories} active={activeCategory} onChange={handleCategoryChange} />

      {error && profiles.length === 0 ? (
        <div className="flex flex-col items-center py-16 px-4 text-center">
          <AlertCircle size={28} className="text-destructive mb-3" />
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => loadProfiles(activeCategory, null, false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : (
        <ProfileGrid
          profiles={profiles}
          loading={initialLoading || (loading && profiles.length === 0)}
          emptyTitle="No profiles here yet"
          emptyDescription="Try a different destination or check back soon for new members."
        />
      )}

      {hasMore && <div ref={sentinelRef} className="h-4" />}
    </div>
  );
}