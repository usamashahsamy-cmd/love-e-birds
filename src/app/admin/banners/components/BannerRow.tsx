"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "@/components/ui/Toast";
import { toggleBanner, deleteBanner } from "@/actions/banners-admin";
import BannerForm from "./BannerForm";

interface BannerRowProps {
  banner: {
    id: string;
    slug: string | null;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    linkUrl: string | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
  };
}

export default function BannerRow({ banner }: BannerRowProps) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleBanner(banner.id, !banner.isActive);
      if (res.success) {
        toast(banner.isActive ? "Banner deactivated" : "Banner activated", "success");
      } else {
        toast(res.error ?? "Failed", "error");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this banner?")) return;
    startTransition(async () => {
      const res = await deleteBanner(banner.id);
      if (res.success) {
        toast("Banner deleted", "success");
      } else {
        toast(res.error ?? "Failed", "error");
      }
    });
  }

  if (editing) {
    return (
      <div className="mb-4">
        <BannerForm initial={banner} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
      <div className="relative w-full sm:w-40 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
        <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold truncate">{banner.title}</p>
            {banner.subtitle && (
              <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              Order: {banner.sortOrder} {banner.slug && <>• Slug: {banner.slug}</>}
            </p>
            {banner.linkUrl && (
              <p className="text-[11px] text-primary truncate">Link: {banner.linkUrl}</p>
            )}
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
              banner.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            }`}
          >
            {banner.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleToggle}
            disabled={pending}
            className="px-3 py-1.5 rounded-lg border border-card-border text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            {banner.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded-lg border border-card-border text-xs font-medium hover:bg-muted"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/5 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
