"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Zap, BadgeCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "@/components/ui/Toast";
import { likeProfile, unlikeProfile, applyForDate } from "@/actions/social";

interface ProfileCardProps {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  location?: string | null;
  points: number;
  likesCount: number;
  isVerified: boolean;
  isOnline: boolean;
  isLiked: boolean;
  interests: { id: string; name: string }[];
}

export default function ProfileCard({
  id,
  username,
  displayName,
  avatar,
  bio,
  location,
  points,
  likesCount,
  isVerified,
  isOnline,
  isLiked,
  interests,
}: ProfileCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likesCount);
  const [pending, startTransition] = useTransition();

  function handleLike() {
    if (pending) return;
    const target = liked;
    setLiked(!target);
    setLikeCount((c) => c + (target ? -1 : 1));
    startTransition(async () => {
      const res = target
        ? await unlikeProfile(id)
        : await likeProfile(id);
      if (!res.success) {
        setLiked(target);
        setLikeCount((c) => c + (target ? 1 : -1));
      } else if ("matched" in res && res.matched) {
        toast("It's a match! 🎉", "success");
      }
    });
  }

  function handleDateApply() {
    if (pending) return;
    startTransition(async () => {
      const res = await applyForDate(id);
      if (res.success) toast("Date request sent!", "success");
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/profile/${username}`} className="relative block aspect-[3/4] overflow-hidden">
        <Image
          src={avatar || `https://placehold.co/400x530/7c3aed/ffffff?text=${encodeURIComponent(displayName.charAt(0))}`}
          alt={displayName}
          fill
          sizes="(max-width: 565px) 47vw, 260px"
          className="object-cover hover:scale-105 transition-transform duration-300"
        />
        {isOnline && (
          <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-success border-2 border-white" />
        )}
        {isVerified && (
          <span className="absolute top-1.5 right-1.5">
            <BadgeCheck size={18} className="text-accent fill-white/90" />
          </span>
        )}

        {location && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] rounded-full px-2 py-0.5">
            <MapPin size={9} /> {location}
          </span>
        )}
      </Link>

      <div className="p-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <Link
            href={`/profile/${username}`}
            className="flex items-center gap-1 min-w-0"
          >
            <span className="font-semibold text-[13px] text-foreground truncate">
              {displayName}
            </span>
          </Link>
          <button
            onClick={handleLike}
            aria-label="Like profile"
            className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
              liked ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-accent hover:bg-accent/10"
            }`}
          >
            <Heart size={16} className={liked ? "fill-current" : ""} />
          </button>
        </div>

        {interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {interests.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="text-[9px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">{bio}</p>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
          <span className="flex items-center gap-1">
            <Zap size={11} className="text-primary" /> {points} pts
          </span>
          <span className="flex items-center gap-1">
            <Heart size={11} className="text-accent" /> {likeCount}
          </span>
        </div>

        <button
          onClick={handleDateApply}
          className="w-full py-1.5 mt-0.5 rounded-lg text-[11px] font-semibold text-white gradient-primary hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Apply for a date
        </button>
      </div>
    </div>
  );
}