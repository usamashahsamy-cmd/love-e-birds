"use client";

import Image from "next/image";

interface ParticipationRowProps {
  participation: {
    id: string;
    user: { id: string; username: string; displayName: string; avatar: string | null };
    activity: { title: string; slug: string };
    product: { name: string; imageUrl: string | null };
    quantity: number;
    ticketCost: number;
    totalCost: number;
    status: string;
    createdAt: string;
  };
}

export default function ParticipationRow({ participation }: ParticipationRowProps) {
  const statusStyle: Record<string, string> = {
    PENDING: "bg-warning/10 text-warning",
    CONFIRMED: "bg-success/10 text-success",
    CANCELLED: "bg-muted text-muted-foreground",
    COMPLETED: "bg-primary/10 text-primary",
  };

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-4">
      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
        {participation.product.imageUrl ? (
          <Image src={participation.product.imageUrl} alt={participation.product.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">🎁</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold truncate">{participation.product.name}</p>
            <p className="text-xs text-muted-foreground truncate">{participation.activity.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              by @{participation.user.username} · {participation.quantity} qty · {participation.totalCost} tickets
            </p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(participation.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusStyle[participation.status] ?? "bg-muted text-muted-foreground"}`}>
            {participation.status}
          </span>
        </div>
      </div>
    </div>
  );
}
