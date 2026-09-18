"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { rechargeWallet } from "@/actions/wallet";

const PRESETS = [100, 200, 500, 1000, 2000, 5000];

const METHODS = ["UPI", "Debit Card", "Net Banking"];

export default function RechargeForm({ balance }: { balance: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(100);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState(METHODS[0]);
  const [pending, startTransition] = useTransition();

  const effectiveAmount = custom ? Number(custom) : amount;

  function handlePreset(value: number) {
    setCustom("");
    setAmount(value);
  }

  function handlePay() {
    const finalAmount = effectiveAmount;
    if (!finalAmount || finalAmount < 10) {
      toast("Minimum recharge is ₹10", "error");
      return;
    }
    if (finalAmount > 100000) {
      toast("Maximum recharge is ₹1,00,000", "error");
      return;
    }

    startTransition(async () => {
      const res = await rechargeWallet({ amount: finalAmount, paymentMethod: method });
      if (res.success) {
        toast(`₹${finalAmount.toLocaleString("en-IN")} recharge request submitted. Awaiting admin approval.`, "success");
        setCustom("");
        router.refresh();
      } else {
        toast(res.error ?? "Recharge failed", "error");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Amount</label>
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          {PRESETS.map((value) => (
            <button
              key={value}
              onClick={() => handlePreset(value)}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                !custom && amount === value
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-card border-card-border text-foreground hover:border-primary/50"
              }`}
            >
              ₹{value.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={100000}
            placeholder="Enter custom amount (min ₹10)"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-card-border bg-card text-sm focus:border-primary outline-none"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            ₹
          </span>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Payment Method</label>
        <div className="space-y-2">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border text-sm transition-all ${
                method === m
                  ? "border-primary bg-primary/5 font-semibold"
                  : "border-card-border bg-card"
              }`}
            >
              {m}
              <span
                className={`w-4 h-4 rounded-full border-2 ${
                  method === m ? "border-primary bg-primary" : "border-card-border"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handlePay}
        disabled={pending}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold gradient-primary hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60"
      >
        {pending ? "Processing..." : `Pay ₹${effectiveAmount.toLocaleString("en-IN")}`}
      </button>

      <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <Zap size={12} className="text-primary" />
        Recharges require admin approval. Current balance: ₹{balance.toLocaleString("en-IN")}
      </p>
    </div>
  );
}