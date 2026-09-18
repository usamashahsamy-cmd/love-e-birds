"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Check, X, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { processWithdrawal } from "@/actions/admin";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  PROCESSING: "bg-primary/10 text-primary",
  APPROVED: "bg-accent/10 text-accent-dark",
  COMPLETED: "bg-success/10 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
};

export default function WithdrawalRow({
  item,
}: {
  item: {
    id: string;
    amount: number;
    status: string;
    accountNote: string | null;
    createdAt: string;
    updatedAt: string;
    user: { username: string; displayName: string; email: string };
    method: string;
    methodType: string;
  };
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function act(action: "PROCESSING" | "APPROVED" | "REJECTED") {
    setActive(action);
    startTransition(async () => {
      const res = await processWithdrawal(item.id, { action, note: note || undefined });
      setActive(null);
      if (res.success) {
        toast(`Withdrawal ${action.toLowerCase()}`, "success");
        router.refresh();
      } else {
        toast(res.error ?? "Action failed", "error");
      }
    });
  }

  const processable = item.status === "PENDING" || item.status === "PROCESSING";

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
            <Banknote size={15} className="text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold">₹{item.amount.toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {item.user.displayName} (@{item.user.username})
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold rounded-full px-2 py-1 ${STATUS_STYLE[item.status]}`}>
          {item.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-muted-foreground">
        <div>
          <p className="text-[10px] uppercase">Payout method</p>
          <p className="font-medium text-foreground truncate">{item.method}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase">Requested</p>
          <p className="font-medium text-foreground">
            {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </p>
        </div>
      </div>

      {item.accountNote && <p className="text-[11px] text-primary mt-2">Note: {item.accountNote}</p>}

      {processable && (
        <div className="space-y-2.5 mt-3 pt-3 border-t border-card-border">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note / reference id (optional)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {item.status === "PENDING" && (
              <button
                onClick={() => act("PROCESSING")}
                disabled={pending}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
              >
                <Loader2 size={13} /> Process
              </button>
            )}
            <button
              onClick={() => act("APPROVED")}
              disabled={pending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-success/10 text-success hover:bg-success/20 disabled:opacity-50 transition-colors"
            >
              <Check size={13} />
              {active === "APPROVED" ? "..." : "Approve"}
            </button>
            <button
              onClick={() => act("REJECTED")}
              disabled={pending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
            >
              <X size={13} />
              {active === "REJECTED" ? "..." : "Reject & refund"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}