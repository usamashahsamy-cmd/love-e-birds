"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Megaphone } from "lucide-react";
import { markAnnouncementRead } from "@/actions/announcements";

export default function AnnouncementList({
  items,
}: {
  items: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    read: boolean;
  }[];
}) {
  const router = useRouter();
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggle(itemId: string, read: boolean) {
    if (opened.has(itemId)) {
      setOpened((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      return;
    }
    setOpened((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    if (!read) {
      setPendingId(itemId);
      const res = await markAnnouncementRead(itemId);
      setPendingId(null);
      if (res.success) {
        router.refresh();
      }
    }
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const isOpen = opened.has(item.id);
        return (
          <div
            key={item.id}
            className={`bg-card border rounded-xl overflow-hidden transition-colors ${
              item.read ? "border-card-border" : "border-warning/40"
            }`}
          >
            <button
              onClick={() => toggle(item.id, item.read)}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Megaphone size={16} className="text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              {item.read || pendingId === item.id ? (
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
              )}
            </button>
            {isOpen && (
              <p className="px-3.5 pb-3.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}