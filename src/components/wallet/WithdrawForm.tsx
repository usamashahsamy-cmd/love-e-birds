"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpFromLine } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import { withdrawWallet } from "@/actions/wallet";

interface PaymentMethodOption {
  id: string;
  label: string;
  maskedDetails: string;
  type: string;
}

export default function WithdrawForm({
  withdrawable,
  methods,
}: {
  withdrawable: number;
  methods: PaymentMethodOption[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState(methods.find((m) => m.type !== "WALLET")?.id ?? methods[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const value = Number(amount) || 0;
  const maxPct = withdrawable > 0 ? Math.min(100, Math.round((value / withdrawable) * 100)) : 0;

  function handleWithdraw() {
    if (!value || value < 100) {
      toast("Minimum withdrawal is ₹100", "error");
      return;
    }
    if (!methodId) {
      toast("Add and select a payment method", "error");
      return;
    }

    startTransition(async () => {
      const res = await withdrawWallet({ amount: value, paymentMethodId: methodId });
      if (res.success) {
        toast("Withdrawal submitted for approval", "success");
        setAmount("");
        router.refresh();
      } else {
        toast(res.error ?? "Withdrawal failed", "error");
      }
    });
  }

  if (methods.length === 0) {
    return (
      <EmptyState
        icon={ArrowUpFromLine}
        title="No payment method"
        description="Add a bank account or UPI to withdraw your balance."
        action={
          <Link
            href="/mine/my-bank"
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
          >
            Add Payment Method
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Amount</label>
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            min={100}
            max={withdrawable}
            placeholder={`Max ₹${withdrawable.toLocaleString("en-IN")}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-card-border bg-card text-base font-semibold focus:border-primary outline-none"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground">
            ₹
          </span>
        </div>
        <div className="mt-2.5">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${maxPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>Min ₹100</span>
            <span>Withdrawable ₹{withdrawable.toLocaleString("en-IN")}</span>
          </div>
        </div>
        {withdrawable <= 0 && (
          <p className="text-[11px] text-destructive mt-1.5">
            Your balance is frozen or zero. Recharge to withdraw.
          </p>
        )}
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Withdraw to</label>
        <div className="space-y-2">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethodId(m.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border text-sm transition-all ${
                methodId === m.id
                  ? "border-primary bg-primary/5 font-semibold"
                  : "border-card-border bg-card"
              }`}
            >
              <span>
                {m.label}
                <span className="block text-[11px] text-muted-foreground font-normal">
                  {m.maskedDetails}
                </span>
              </span>
              <span
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  methodId === m.id ? "border-primary bg-primary" : "border-card-border"
                }`}
              />
            </button>
          ))}
        </div>
        <Link
          href="/mine/my-bank"
          className="inline-flex items-center gap-1 mt-2 text-xs text-primary font-medium"
        >
          + Manage payment methods
        </Link>
      </div>

      <button
        onClick={handleWithdraw}
        disabled={pending || value <= 0 || value > withdrawable}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold bg-accent hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:active:scale-100"
      >
        {pending ? "Submitting..." : `Withdraw ₹${value.toLocaleString("en-IN")}`}
      </button>
    </div>
  );
}