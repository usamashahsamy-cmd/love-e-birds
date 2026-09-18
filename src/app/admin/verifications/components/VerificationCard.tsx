"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldX, BadgeCheck } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { reviewVerification } from "@/actions/admin";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
};

export default function VerificationCard({
  item,
}: {
  item: {
    id: string;
    status: string;
    fullName: string;
    idType: string | null;
    documentUrl: string | null;
    selfieUrl: string | null;
    notes: string | null;
    createdAt: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      email: string;
      avatar: string | null;
      isVerified: boolean;
    };
  };
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(item.notes ?? "");
  const [pending, startTransition] = useTransition();

  function act(action: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const res = await reviewVerification(item.id, { action, notes: notes || undefined });
      if (res.success) {
        toast(action === "APPROVED" ? "Verification approved" : "Verification rejected", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Action failed", "error");
      }
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {item.user.avatar ? (
            <Image
              src={item.user.avatar}
              alt={item.user.displayName}
              width={38}
              height={38}
              className="w-[38px] h-[38px] rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-[38px] h-[38px] rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-muted-foreground">
                {item.user.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {item.fullName}
              {item.user.isVerified && (
                <BadgeCheck size={14} className="inline text-accent ml-1 -mt-0.5" />
              )}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              @{item.user.username} · {item.idType?.replace("_", " ") ?? "—"}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold rounded-full px-2 py-1 ${STATUS_STYLE[item.status]}`}>
          {item.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">ID document</p>
          {item.documentUrl ? (
            <div className="relative aspect-[3/2] rounded-lg overflow-hidden bg-muted">
              <Image src={item.documentUrl} alt="ID" fill sizes="200px" className="object-cover" />
            </div>
          ) : (
            <div className="aspect-[3/2] rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
              No document
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Selfie</p>
          {item.selfieUrl ? (
            <div className="relative aspect-[3/2] rounded-lg overflow-hidden bg-muted">
              <Image src={item.selfieUrl} alt="Selfie" fill sizes="200px" className="object-cover" />
            </div>
          ) : (
            <div className="aspect-[3/2] rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
              Not provided
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Submitted {new Date(item.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
      </p>

      {item.status === "PENDING" ? (
        <div className="space-y-3 pt-1">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (shown to user if rejected)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => act("APPROVED")}
              disabled={pending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-success/10 text-success hover:bg-success/20 disabled:opacity-50 transition-colors"
            >
              <ShieldCheck size={13} /> Approve
            </button>
            <button
              onClick={() => act("REJECTED")}
              disabled={pending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
            >
              <ShieldX size={13} /> Reject
            </button>
          </div>
        </div>
      ) : item.status === "REJECTED" && item.notes ? (
        <p className="text-xs text-destructive">Reason: {item.notes}</p>
      ) : null}
    </div>
  );
}