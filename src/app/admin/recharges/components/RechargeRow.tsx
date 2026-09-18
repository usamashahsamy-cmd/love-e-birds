"use client";

import { useTransition } from "react";
import { History } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { reviewRecharge } from "@/actions/recharges-admin";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  PROCESSING: "bg-primary/10 text-primary",
  COMPLETED: "bg-success/10 text-success",
  FAILED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
  REJECTED: "bg-destructive/10 text-destructive",
};

interface RechargeRowProps {
  recharge: {
    id: string;
    amount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
    user: { displayName: string; username: string };
  };
}

export default function RechargeRow({ recharge }: RechargeRowProps) {
  const [pending, startTransition] = useTransition();

  function handleAction(action: "APPROVED" | "CANCELLED") {
    startTransition(async () => {
      const res = await reviewRecharge(recharge.id, action);
      if (res.success) {
        toast(action === "APPROVED" ? "Recharge approved" : "Recharge rejected", "success");
      } else {
        toast(res.error ?? "Action failed", "error");
      }
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
            <History size={15} className="text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold">₹{recharge.amount.toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {recharge.user.displayName} (@{recharge.user.username})
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold rounded-full px-2 py-1 ${STATUS_STYLE[recharge.status]}`}>
          {recharge.status}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        Method: {recharge.paymentMethod} ·{" "}
        {new Date(recharge.createdAt).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      {recharge.status === "PENDING" && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleAction("APPROVED")}
            disabled={pending}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-success/10 text-success hover:bg-success/20 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction("CANCELLED")}
            disabled={pending}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
