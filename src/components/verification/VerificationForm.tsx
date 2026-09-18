"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { submitVerification } from "@/actions/verification";

const ID_TYPES = ["AADHAAR", "PAN", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID"] as const;

export default function VerificationForm({
  defaultFullName,
}: {
  defaultFullName?: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultFullName ?? "");
  const [idType, setIdType] = useState<(typeof ID_TYPES)[number]>("AADHAAR");
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"doc" | "selfie" | null>(null);
  const [pending, startTransition] = useTransition();
  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(type: "doc" | "selfie", file: File | undefined) {
    if (!file) return;
    setUploading(type);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      if (type === "doc") setDocumentUrl(data.url);
      else setSelfieUrl(data.url);
      toast("Upload successful", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(null);
    }
  }

  function handleSubmit() {
    if (!fullName.trim() || !documentUrl) {
      toast("Fill your full name and upload your ID document", "error");
      return;
    }
    startTransition(async () => {
      const res = await submitVerification({
        fullName: fullName.trim(),
        idType,
        documentUrl,
        selfieUrl: selfieUrl ?? undefined,
      });
      if (res.success) {
        toast("Verification request submitted", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Failed to submit", "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Full name (as per ID)</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Aisha Sharma"
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">ID type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {ID_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setIdType(t)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                idType === t
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-card-border text-muted-foreground"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">ID document (front)</p>
        <input
          ref={docInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile("doc", e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => docInputRef.current?.click()}
          disabled={uploading === "doc"}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-card-border hover:border-primary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {uploading === "doc" ? (
              <Loader2 size={18} className="text-muted-foreground animate-spin" />
            ) : documentUrl ? (
              <CheckCircle2 size={18} className="text-success" />
            ) : (
              <FileText size={18} className="text-muted-foreground" />
            )}
          </div>
          <div className="text-left flex-1 min-w-0">
            {documentUrl ? (
              <p className="text-sm font-medium text-success">Document uploaded</p>
            ) : (
              <>
                <p className="text-sm font-medium">Tap to upload</p>
                <p className="text-[11px] text-muted-foreground">
                  {uploading === "doc" ? "Uploading..." : "JPG/PNG/WEBP, max 5MB"}
                </p>
              </>
            )}
          </div>
          {documentUrl && (
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={documentUrl} alt="doc" width={36} height={36} className="object-cover" />
            </div>
          )}
        </button>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Selfie (optional, helps us match you)</p>
        <input
          ref={selfieInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile("selfie", e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => selfieInputRef.current?.click()}
          disabled={uploading === "selfie"}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-card-border hover:border-primary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {uploading === "selfie" ? (
              <Loader2 size={18} className="text-muted-foreground animate-spin" />
            ) : selfieUrl ? (
              <CheckCircle2 size={18} className="text-success" />
            ) : (
              <UploadCloud size={18} className="text-muted-foreground" />
            )}
          </div>
          <div className="text-left flex-1 min-w-0">
            {selfieUrl ? (
              <p className="text-sm font-medium text-success">Selfie uploaded</p>
            ) : (
              <>
                <p className="text-sm font-medium">Tap to upload</p>
                <p className="text-[11px] text-muted-foreground">Optional</p>
              </>
            )}
          </div>
          {selfieUrl && (
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
              <Image src={selfieUrl} alt="selfie" width={36} height={36} className="object-cover" />
            </div>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold gradient-primary hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit for verification"}
      </button>
      <p className="text-[11px] text-muted-foreground text-center">
        Your documents are stored securely and only seen by our review team.
      </p>
    </div>
  );
}