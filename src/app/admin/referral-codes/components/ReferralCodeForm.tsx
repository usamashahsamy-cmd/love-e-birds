"use client";

import { useState, useTransition } from "react";
import { toast } from "@/components/ui/Toast";
import { createReferralCode } from "@/actions/referral-codes-admin";

export default function ReferralCodeForm() {
  const [code, setCode] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createReferralCode(code, Number(maxUses));
      if (res.success) {
        toast("Referral code created", "success");
        setCode("");
        setMaxUses("1");
      } else {
        toast(res.error ?? "Failed to create", "error");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-bold">Create Referral Code</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. VIP2024"
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Max Uses</label>
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value.replace(/[^\d]/g, ""))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending || !code.trim()}
        className="px-4 py-2 rounded-lg gradient-primary text-white text-sm font-bold disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create Code"}
      </button>
    </form>
  );
}
