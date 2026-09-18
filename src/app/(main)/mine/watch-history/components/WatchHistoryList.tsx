"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { clearWatchHistory } from "@/actions/settings";

export default function WatchHistoryList({
  items,
}: {
  items: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    location: string | null;
    viewedAt: string;
  }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClear() {
    startTransition(async () => {
      const res = await clearWatchHistory();
      if (res.success) {
        toast("Watch history cleared", "success");
        router.refresh();
      } else {
        toast("Failed to clear history", "error");
      }
    });
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={handleClear}
          disabled={pending}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground border border-card-border rounded-lg px-3 py-1.5 hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-50"
        >
          <Trash2 size={12} /> {pending ? "Clearing..." : "Clear history"}
        </button>
      </div>
      <div className="space-y-2.5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/profile/${item.username}`}
            className="flex items-center gap-3 bg-card border border-card-border rounded-xl px-3 py-3 hover:border-primary/40 transition-colors"
          >
            {item.avatar ? (
              <Image
                src={item.avatar}
                alt={item.displayName}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-muted-foreground">
                  {item.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{item.displayName}</p>
              {item.location && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <MapPin size={10} /> {item.location}
                </p>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground flex-shrink-0">
              {new Date(item.viewedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}