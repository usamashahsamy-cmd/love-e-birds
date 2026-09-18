"use client";

import { useState, useTransition } from "react";
import { toast } from "@/components/ui/Toast";
import { saveBanner } from "@/actions/banners-admin";
import Image from "next/image";
import { UploadCloud, CheckCircle2, Loader2 } from "lucide-react";

interface BannerFormProps {
  initial?: {
    id: string;
    slug: string | null;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    linkUrl: string | null;
    sortOrder: number;
    isActive: boolean;
  } | null;
  onDone?: () => void;
}

export default function BannerForm({ initial, onDone }: BannerFormProps) {
  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    subtitle: initial?.subtitle ?? "",
    imageUrl: initial?.imageUrl ?? "",
    linkUrl: initial?.linkUrl ?? "",
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
  });
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
      setForm((f) => ({ ...f, imageUrl: json.url }));
      toast("Image uploaded", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveBanner({
        id: initial?.id,
        slug: form.slug || undefined,
        title: form.title,
        subtitle: form.subtitle || undefined,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || undefined,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      });
      if (res.success) {
        toast(initial ? "Banner updated" : "Banner created", "success");
        if (!initial) {
          setForm({
            slug: "",
            title: "",
            subtitle: "",
            imageUrl: "",
            linkUrl: "",
            sortOrder: 0,
            isActive: true,
          });
        }
        onDone?.();
      } else {
        toast(res.error ?? "Failed to save", "error");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-card-border rounded-2xl p-5">
      <h3 className="text-sm font-bold">{initial ? "Edit Banner" : "Create Banner"}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Slug (optional)</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="e.g. verification-vip"
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Use <code>verification-vip</code> for the verification page banner.
          </p>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Subtitle</label>
        <input
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Banner Image</label>
        <input
          type="file"
          accept="image/*"
          hidden
          id="banner-image-input"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <label
          htmlFor="banner-image-input"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-card-border hover:border-primary/50 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {uploading ? (
              <Loader2 size={18} className="text-muted-foreground animate-spin" />
            ) : form.imageUrl ? (
              <CheckCircle2 size={18} className="text-success" />
            ) : (
              <UploadCloud size={18} className="text-muted-foreground" />
            )}
          </div>
          <div className="text-left flex-1 min-w-0">
            {form.imageUrl ? (
              <p className="text-sm font-medium text-success">Image uploaded</p>
            ) : (
              <>
                <p className="text-sm font-medium">Tap to upload image</p>
                <p className="text-[11px] text-muted-foreground">Recommended size: 1200×400 px</p>
              </>
            )}
          </div>
          {form.imageUrl && (
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
              <Image src={form.imageUrl} alt="preview" fill className="object-cover" />
            </div>
          )}
        </label>
        {form.imageUrl && (
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full mt-2 px-3 py-2 text-xs rounded-lg border border-card-border bg-card focus:border-primary outline-none"
            placeholder="Image URL"
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Link URL (optional)</label>
          <input
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
            placeholder="e.g. /activities/airborne-activities"
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Sort Order</label>
          <input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          className="rounded border-card-border"
        />
        Active
      </label>

      <div className="flex gap-3">
        {initial && (
          <button
            type="button"
            onClick={onDone}
            className="flex-1 py-2.5 rounded-lg border border-card-border text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={pending || uploading || !form.imageUrl}
          className="flex-1 py-2.5 rounded-lg gradient-primary text-white text-sm font-bold disabled:opacity-50"
        >
          {pending ? "Saving..." : initial ? "Update Banner" : "Create Banner"}
        </button>
      </div>
    </form>
  );
}
