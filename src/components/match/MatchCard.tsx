"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, BadgeCheck, MessageCircle, Heart, UserX } from "lucide-react";

interface MatchCardProps {
  username: string;
  displayName: string;
  avatar: string | null;
  location?: string | null;
  isOnline: boolean;
  isVerified: boolean;
  likesCount: number;
  onUnmatch: () => void;
}

export default function MatchCard({
  username,
  displayName,
  avatar,
  location,
  isOnline,
  isVerified,
  likesCount,
  onUnmatch,
}: MatchCardProps) {
  return (
    <div className="flex items-center gap-3 bg-card border border-card-border rounded-xl px-3 py-3">
      <Link href={`/profile/${username}`} className="relative flex-shrink-0">
        {avatar ? (
          <Image
            src={avatar}
            alt={displayName}
            width={52}
            height={52}
            className="w-[52px] h-[52px] rounded-full object-cover"
          />
        ) : (
          <div className="w-[52px] h-[52px] rounded-full bg-muted flex items-center justify-center">
            <span className="text-lg font-bold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-success border-2 border-card" />
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/profile/${username}`}
            className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors"
          >
            {displayName}
          </Link>
          {isVerified && <BadgeCheck size={15} className="text-accent flex-shrink-0" />}
        </div>
        {location && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 truncate">
            <MapPin size={11} className="flex-shrink-0" /> {location}
          </p>
        )}
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
          <Heart size={10} className="text-accent" /> {likesCount} likes
        </p>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <Link
          href={`/messages/${username}`}
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white gradient-primary hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <MessageCircle size={12} /> Chat
        </Link>
        <button
          onClick={onUnmatch}
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground border border-card-border hover:text-destructive hover:border-destructive/40 transition-colors"
        >
          <UserX size={12} /> Unmatch
        </button>
      </div>
    </div>
  );
}