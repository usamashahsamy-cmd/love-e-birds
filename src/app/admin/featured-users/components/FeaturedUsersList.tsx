"use client";

import Image from "next/image";
import { useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { setUserFeatured } from "@/actions/admin";

interface User {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
  isFeatured: boolean;
}

export default function FeaturedUsersList({ users }: { users: User[] }) {
  const [pending, startTransition] = useTransition();

  function toggle(userId: string, featured: boolean) {
    startTransition(async () => {
      const res = await setUserFeatured(userId, featured);
      if (res.success) {
        toast(featured ? "User featured" : "User removed from featured", "success");
      } else {
        toast(res.error ?? "Failed", "error");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((u) => (
        <div
          key={u.id}
          className={`bg-card border rounded-2xl p-4 flex items-center gap-3 transition-colors ${
            u.isFeatured ? "border-primary" : "border-card-border"
          }`}
        >
          {u.avatar ? (
            <Image
              src={u.avatar}
              alt={u.displayName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-muted-foreground">{u.displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{u.displayName}</p>
            <p className="text-[11px] text-muted-foreground truncate">@{u.username}</p>
          </div>
          <button
            onClick={() => toggle(u.id, !u.isFeatured)}
            disabled={pending}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors ${
              u.isFeatured
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Star size={13} className={u.isFeatured ? "fill-primary" : ""} />
            {u.isFeatured ? "Featured" : "Feature"}
          </button>
        </div>
      ))}
    </div>
  );
}
