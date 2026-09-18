"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag, Check, X, ShieldAlert, Ban } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { reviewReport } from "@/actions/admin";

const TYPE_LABEL: Record<string, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  FAKE_PROFILE: "Fake profile",
  INAPPROPRIATE: "Inappropriate",
  OTHER: "Other",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  REVIEWED: "bg-primary/10 text-primary",
  RESOLVED: "bg-success/10 text-success",
  DISMISSED: "bg-muted text-muted-foreground",
};

export default function ReportCard({
  report,
}: {
  report: {
    id: string;
    status: string;
    type: string;
    reason: string;
    adminNote: string | null;
    createdAt: string;
    reporter: { username: string; displayName: string; email: string };
    target: { id: string; username: string; displayName: string; email: string; status: string };
  };
}) {
  const router = useRouter();
  const [note, setNote] = useState(report.adminNote ?? "");
  const [banTarget, setBanTarget] = useState(false);
  const [pending, startTransition] = useTransition();
  const resolved = report.status !== "PENDING" && report.status !== "REVIEWED";

  function act(action: "REVIEWED" | "RESOLVED" | "DISMISSED") {
    startTransition(async () => {
      const res = await reviewReport(report.id, { action, note: note || undefined, banTarget });
      if (res.success) {
        toast(`Report ${action.toLowerCase()}`, "success");
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
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <Flag size={15} className="text-destructive" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              <span className="text-destructive">{TYPE_LABEL[report.type] ?? report.type}</span> ·{" "}
              {report.target.displayName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Reporter: {report.reporter.displayName} (@{report.reporter.username})
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold rounded-full px-2 py-1 ${STATUS_STYLE[report.status]}`}>
          {report.status}
        </span>
      </div>

      <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 leading-relaxed">
        “{report.reason}”
      </p>
      <p className="text-[10px] text-muted-foreground">
        {new Date(report.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Target status: {report.target.status}
      </p>

      {resolved ? (
        report.adminNote ? (
          <p className="text-xs text-primary">Note: {report.adminNote}</p>
        ) : null
      ) : (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-1.5">
            <input
              id={`ban-${report.id}`}
              type="checkbox"
              checked={banTarget}
              onChange={(e) => setBanTarget(e.target.checked)}
              className="w-3.5 h-3.5 accent-red-600"
            />
            <label htmlFor={`ban-${report.id}`} className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <Ban size={12} /> Ban {report.target.displayName} (@{report.target.username})
            </label>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Admin note (optional)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => act("REVIEWED")}
              disabled={pending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
            >
              <ShieldAlert size={13} /> Reviewed
            </button>
            <button
              onClick={() => act("RESOLVED")}
              disabled={pending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-success/10 text-success hover:bg-success/20 disabled:opacity-50 transition-colors"
            >
              <Check size={13} /> Resolved
            </button>
            <button
              onClick={() => act("DISMISSED")}
              disabled={pending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground border border-card-border hover:text-foreground disabled:opacity-50 transition-colors"
            >
              <X size={13} /> Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}