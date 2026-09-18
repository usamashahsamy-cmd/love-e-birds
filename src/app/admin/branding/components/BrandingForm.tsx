"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Upload, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { uploadLogo, resetLogo } from "@/actions/branding-admin";

export default function BrandingForm({ initialLogoUrl }: { initialLogoUrl: string | null }) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [pending, startTransition] = useTransition();

  function handleUpload(formData: FormData) {
    startTransition(async () => {
      const res = await uploadLogo(formData);
      if (res.success && res.logoUrl) {
        setLogoUrl(res.logoUrl);
        toast("Logo updated", "success");
      } else {
        toast(res.error ?? "Upload failed", "error");
      }
    });
  }

  function handleReset() {
    startTransition(async () => {
      const res = await resetLogo();
      if (res.success) {
        setLogoUrl(null);
        toast("Logo reset to default", "success");
      } else {
        toast(res.error ?? "Reset failed", "error");
      }
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 space-y-5 max-w-xl">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Current Logo</label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative w-20 h-20 rounded-2xl border border-card-border overflow-hidden bg-background">
              <Image src={logoUrl} alt="App logo" fill className="object-contain p-2" sizes="80px" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
              <span className="text-white text-2xl font-bold">LB</span>
            </div>
          )}
          <div className="text-sm">
            <p className="font-semibold">{logoUrl ? "Custom logo" : "Default logo"}</p>
            <p className="text-muted-foreground text-xs mt-0.5">Recommended: 512×512 PNG with transparent background</p>
          </div>
        </div>
      </div>

      <form action={handleUpload} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Upload PNG</label>
          <input
            type="file"
            name="logo"
            accept="image/png"
            required
            className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-bold disabled:opacity-50"
        >
          <Upload size={16} /> {pending ? "Uploading..." : "Upload Logo"}
        </button>
      </form>

      {logoUrl && (
        <button
          onClick={handleReset}
          disabled={pending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 disabled:opacity-50"
        >
          <Trash2 size={16} /> Reset to default
        </button>
      )}
    </div>
  );
}
