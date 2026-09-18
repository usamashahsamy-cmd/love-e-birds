"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

interface FeaturedUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export default function FeaturedUsers({ users }: { users: FeaturedUser[] }) {
  if (users.length === 0) return null;

  return (
    <section className="py-4">
      <div className="flex items-center gap-2 px-4 mb-3">
        <Star size={16} className="text-primary" />
        <h2 className="text-sm font-bold">Featured Profiles</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar">
        {users.map((u) => (
          <Link
            key={u.id}
            href={`/profile/${u.username}`}
            className="flex-shrink-0 w-[76px] text-center group"
          >
            <div className="relative w-[76px] h-[76px] rounded-full p-[2px] gradient-primary">
              <div className="w-full h-full rounded-full bg-card border-2 border-background overflow-hidden">
                {u.avatar ? (
                  <Image
                    src={u.avatar}
                    alt={u.displayName}
                    width={76}
                    height={76}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-bold text-muted-foreground">{u.displayName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] font-semibold mt-2 truncate group-hover:text-primary transition-colors">{u.displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">@{u.username}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
