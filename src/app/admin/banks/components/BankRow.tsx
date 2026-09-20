"use client";

import Link from "next/link";
import { Landmark, Smartphone, Star, UserCircle2 } from "lucide-react";

interface BankRowItem {
  id: string;
  type: string;
  label: string;
  maskedDetails: string;
  isDefault: boolean;
  createdAt: string;
  bankName: string;
  accountHolder: string;
  ifscCode: string;
  value: string;
  user: {
    id: string;
    displayName: string;
    username: string;
    email: string;
  };
}

export default function BankRow({ item }: { item: BankRowItem }) {
  const isBank = item.type === "BANK_ACCOUNT";

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {isBank ? (
              <Landmark size={17} className="text-muted-foreground" />
            ) : (
              <Smartphone size={17} className="text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{item.user.displayName}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              @{item.user.username} · {item.user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.isDefault && (
            <span className="inline-flex items-center gap-0.5 text-[10px] bg-primary/10 text-primary font-semibold rounded-full px-2 py-1">
              <Star size={10} className="fill-current" /> Default
            </span>
          )}
          <span
            className={`text-[10px] font-semibold rounded-full px-2 py-1 ${
              isBank ? "bg-accent/10 text-accent-dark" : "bg-primary/10 text-primary"
            }`}
          >
            {isBank ? "Bank Account" : "UPI"}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
        {isBank ? (
          <>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Bank Name</p>
              <p className="font-medium text-foreground">{item.bankName || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Account Holder</p>
              <p className="font-medium text-foreground">{item.accountHolder || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Account Number</p>
              <p className="font-semibold text-foreground tracking-wide">{item.value || item.maskedDetails}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">IFSC Code</p>
              <p className="font-semibold text-foreground tracking-wide">{item.ifscCode || "—"}</p>
            </div>
          </>
        ) : (
          <div className="col-span-2">
            <p className="text-[10px] uppercase text-muted-foreground">UPI ID</p>
            <p className="font-semibold text-foreground tracking-wide">{item.value || item.label}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-card-border">
        <p className="text-[11px] text-muted-foreground">{item.label}</p>
        <div className="flex items-center gap-3">
          <p className="text-[11px] text-muted-foreground">
            Added {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <Link
            href={`/admin/users/${item.user.id}`}
            className="inline-flex items-center gap-1 text-[11px] text-primary font-medium"
          >
            <UserCircle2 size={13} /> User
          </Link>
        </div>
      </div>
    </div>
  );
}