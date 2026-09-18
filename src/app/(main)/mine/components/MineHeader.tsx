"use client";

import { signOut } from "next-auth/react";
import { Star, LogOut } from "lucide-react";
import Image from "next/image";

interface MineHeaderProps {
  username: string;
  displayName: string;
  avatar: string | null;
  creditScore: number;
  profile: {
    points: number;
    isVerified: boolean;
  } | null;
}

export default function MineHeader({
  username,
  displayName,
  avatar,
  creditScore,
  profile,
}: MineHeaderProps) {
  const points = profile?.points ?? 0;
  const progress = Math.min((points % 1000) / 10, 100);

  return (
    <div className="gradient-primary text-white px-5 pt-6 pb-28 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-10 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />

      <div className="flex items-center justify-between relative z-10">
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <LogOut size={20} />
        </button>
        <h2 className="font-semibold text-sm">{username}</h2>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <span>EN</span>
        </button>
      </div>

      <div className="flex items-center gap-4 mt-4 relative z-10">
        {avatar ? (
          <Image
            src={avatar}
            alt={displayName}
            width={64}
            height={64}
            className="w-16 h-16 rounded-full border-2 border-white/70 object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full border-2 border-white/70 bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold">{displayName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-wide">{displayName.toUpperCase()}</h1>
          {profile?.isVerified ? (
            <span className="inline-flex items-center gap-1 text-[11px] bg-white/20 rounded-full px-2 py-0.5 mt-0.5">
              <Star size={10} className="fill-yellow-300 text-yellow-300" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] bg-white/20 rounded-full px-2 py-0.5 mt-0.5">
              Not verified
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 relative z-10">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-white/80">Credit score</span>
          <span className="font-bold">{creditScore}</span>
        </div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-white/80">Accumulated points</span>
          <span className="font-bold">{points} pts</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}