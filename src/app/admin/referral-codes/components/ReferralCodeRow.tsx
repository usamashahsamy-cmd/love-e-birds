"use client";

import { useTransition } from "react";
import { toast } from "@/components/ui/Toast";
import { toggleReferralCode, deleteReferralCode } from "@/actions/referral-codes-admin";

interface ReferralCodeRowProps {
  code: {
    id: string;
    code: string;
    maxUses: number;
    usedCount: number;
    active: boolean;
    createdAt: string;
  };
}

export default function ReferralCodeRow({ code }: ReferralCodeRowProps) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleReferralCode(code.id, !code.active);
      if (res.success) {
        toast(code.active ? "Code deactivated" : "Code activated", "success");
      } else {
        toast(res.error ?? "Failed", "error");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this referral code?")) return;
    startTransition(async () => {
      const res = await deleteReferralCode(code.id);
      if (res.success) {
        toast("Code deleted", "success");
      } else {
        toast(res.error ?? "Failed", "error");
      }
    });
  }

  const isExhausted = code.usedCount >= code.maxUses;

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-bold truncate font-mono">{code.code}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Used {code.usedCount} of {code.maxUses}
          {isExhausted && <span className="text-destructive ml-1">• Exhausted</span>}
        </p>
        <p className="text-[10px] text-muted-foreground">
          Created {new Date(code.createdAt).toLocaleDateString("en-IN")}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
            code.active && !isExhausted ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
          }`}
        >
          {code.active && !isExhausted ? "Active" : "Inactive"}
        </span>
        <button
          onClick={handleToggle}
          disabled={pending}
          className="px-3 py-1.5 rounded-lg border border-card-border text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          {code.active ? "Deactivate" : "Activate"}
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
  );
}
