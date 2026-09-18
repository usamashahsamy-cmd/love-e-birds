"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Power, Eye } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { toggleAnnouncement } from "@/actions/admin";

export default function AnnouncementRow({
  announcement,
}: {
  announcement: {
    id: string;
    title: string;
    content: string;
    target: string;
    isActive: boolean;
    reads: number;
    createdAt: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await toggleAnnouncement(announcement.id, !announcement.isActive);
      if (res.success) {
        toast(announcement.isActive ? "Announcement hidden" : "Announcement published", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Action failed", "error");
      }
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 min-w-0 text-left">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
            <Megaphone size={15} className="text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{announcement.title}</p>
            <p className="text-[11px] text-muted-foreground">
              {announcement.target} · {announcement.reads} reads ·{" "}
              {new Date(announcement.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="View"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={toggle}
            disabled={pending}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors ${
              announcement.isActive
                ? "bg-success/10 text-success hover:bg-success/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Power size={13} />
            {announcement.isActive ? "Active" : "Hidden"}
          </button>
        </div>
      </div>
      {open && (
        <p className="text-xs text-muted-foreground mt-3 pr-2 leading-relaxed whitespace-pre-wrap">
          {announcement.content}
        </p>
      )}
    </div>
  );
}