"use client";

import Link from "next/link";
import { History, ChevronLeft, ChevronRight } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface Row {
  id: string;
  activityTitle: string;
  productName: string;
  quantity: number;
  ticketsUsed: number;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default function HistoryList({
  rows,
  page,
  totalPages,
  total,
}: {
  rows: Row[];
  page: number;
  totalPages: number;
  total: number;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No activity history"
        description="Participate in an activity to see it here."
      />
    );
  }

  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-3">{total} record{total !== 1 ? "s" : ""}</p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="bg-card border border-card-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold truncate flex-1">{r.activityTitle}</p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status] ?? "bg-muted text-muted-foreground"}`}>
                {r.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              <span>Product: <span className="text-foreground font-medium">{r.productName}</span></span>
              <span>Qty: <span className="text-foreground font-medium">{r.quantity}</span></span>
              <span>Tickets: <span className="text-foreground font-medium">{r.ticketsUsed}</span></span>
              <span>{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Link
            href={`/activities/history?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-card-border ${
              page <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-muted"
            }`}
          >
            <ChevronLeft size={14} /> Prev
          </Link>
          <span className="text-[11px] text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/activities/history?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-card-border ${
              page >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-muted"
            }`}
          >
            Next <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
