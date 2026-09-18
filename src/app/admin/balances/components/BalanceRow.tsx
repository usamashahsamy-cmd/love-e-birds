"use client";

import { useState, useTransition } from "react";
import { toast } from "@/components/ui/Toast";
import { freezeBalance, deductBalance, unfreezeBalance } from "@/actions/balance-admin";

interface BalanceRowProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    email: string;
    balance: number;
    frozenBalance: number;
  };
}

export default function BalanceRow({ user }: BalanceRowProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const available = user.balance - user.frozenBalance;

  function runAction(action: "freeze" | "deduct" | "unfreeze") {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }

    startTransition(async () => {
      let res;
      if (action === "freeze") res = await freezeBalance(user.id, value);
      else if (action === "deduct") res = await deductBalance(user.id, value, reason);
      else res = await unfreezeBalance(user.id, value);

      if (res.success) {
        toast(action === "freeze" ? "Balance frozen" : action === "deduct" ? "Balance deducted" : "Balance unfrozen", "success");
        setAmount("");
        setReason("");
      } else {
        toast(res.error ?? "Action failed", "error");
      }
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{user.displayName}</p>
          <p className="text-[11px] text-muted-foreground">@{user.username} · {user.email}</p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-[11px]">
            <span>Balance: <span className="font-semibold">₹{user.balance.toLocaleString("en-IN")}</span></span>
            <span>Frozen: <span className="font-semibold">₹{user.frozenBalance.toLocaleString("en-IN")}</span></span>
            <span>Available: <span className="font-semibold text-success">₹{available.toLocaleString("en-IN")}</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-card-border">
        <div className="space-y-2">
          <input
            type="number"
            min={1}
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            className="w-full px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
          <button
            onClick={() => runAction("freeze")}
            disabled={pending}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-warning/10 text-warning hover:bg-warning/20 disabled:opacity-50"
          >
            Freeze
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
          <button
            onClick={() => runAction("deduct")}
            disabled={pending}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            Deduct
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="number"
            min={1}
            placeholder="Unfreeze amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            className="w-full px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
          <button
            onClick={() => runAction("unfreeze")}
            disabled={pending}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-success/10 text-success hover:bg-success/20 disabled:opacity-50"
          >
            Unfreeze
          </button>
        </div>
      </div>
    </div>
  );
}
