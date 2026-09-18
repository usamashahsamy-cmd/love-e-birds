"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface GiftRow {
  id: string;
  points: number;
  message: string | null;
  createdAt: Date;
  gift: { name: string; imageUrl: string | null };
  sender?: { username: string; displayName: string; avatar: string | null } | null;
  receiver?: { username: string; displayName: string; avatar: string | null } | null;
}

export default function GiftRecordList({
  received,
  sent,
}: {
  received: GiftRow[];
  sent: GiftRow[];
}) {
  const [tab, setTab] = useState<"received" | "sent">(received.length > 0 ? "received" : "sent");
  const rows = tab === "received" ? received : sent;

  return (
    <div>
      <div className="flex gap-1.5 mb-3 bg-muted rounded-xl p-1">
        {(["received", "sent"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
              tab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {rows.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            No gifts {tab} yet.
          </p>
        ) : (
          rows.map((row) => {
            const person = tab === "received" ? row.sender : row.receiver;
            return (
              <div
                key={row.id}
                className="bg-card border border-card-border rounded-xl p-3.5 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {row.gift.imageUrl ? (
                    <Image
                      src={row.gift.imageUrl}
                      alt={row.gift.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-lg">🎁</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {row.gift.name}
                    <span
                      className={`ml-1.5 text-xs font-bold ${
                        tab === "received" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {tab === "received" ? "+" : "−"}
                      {row.points} pts
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {tab === "received" ? "from" : "to"}{" "}
                    {person ? (
                      <Link href={`/profile/${person.username}`} className="text-primary font-medium">
                        {person.displayName}
                      </Link>
                    ) : (
                      "someone"
                    )}
                    {row.message ? ` · "${row.message}"` : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {row.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {row.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}