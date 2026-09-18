import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { History, Receipt } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

const TYPE_STYLES: Record<string, { label: string; sign: 1 | -1 | 0 }> = {
  RECHARGE: { label: "Wallet recharge", sign: 1 },
  WITHDRAWAL: { label: "Withdrawal", sign: -1 },
  GIFT_SENT: { label: "Gift sent", sign: -1 },
  GIFT_RECEIVED: { label: "Gift received", sign: 1 },
  DATE_APPLICATION: { label: "Date application", sign: -1 },
  REFUND: { label: "Refund", sign: 1 },
  BONUS: { label: "Bonus", sign: 1 },
  ADMIN_ADJUSTMENT: { label: "Adjustment", sign: 0 },
};

export default async function PointsHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });

  const giftTransactions = await prisma.giftTransaction.findMany({
    where: { receiverId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { gift: true },
  });

  type Row = {
    id: string;
    key: string;
    date: Date;
    label: string;
    amount: number;
    sign: 1 | -1 | 0;
    description: string;
  };

  const rows: Row[] = [
    ...(wallet?.transactions ?? []).map((t) => {
      const style = TYPE_STYLES[t.type] ?? TYPE_STYLES.ADMIN_ADJUSTMENT;
      return {
        id: t.id,
        key: `wallet-${t.id}`,
        date: t.createdAt,
        label: style.label,
        sign: style.sign,
        amount: Number(t.amount.toString()),
        description: t.description,
      };
    }),
    ...giftTransactions.map((g) => ({
      id: g.id,
      key: `gift-${g.id}`,
      date: g.createdAt,
      label: "Gift received",
      sign: 1 as const,
      amount: Number(g.value.toString()),
      description: `Gift: ${g.gift.name}`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (rows.length === 0) {
    return (
      <div className="px-4 pt-4 pb-6">
        <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
          <History size={20} className="text-primary" /> Points History
        </h1>
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Your recharge, withdrawals and gift earnings appear here."
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <History size={20} className="text-primary" /> Points History
      </h1>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.key}
            className="bg-card border border-card-border rounded-xl p-3.5 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{row.label}</p>
              {row.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{row.description}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {row.date.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                · {row.date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <span
              className={`text-sm font-bold flex-shrink-0 ${
                row.sign > 0 ? "text-success" : row.sign < 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {row.sign > 0 ? "+" : row.sign < 0 ? "−" : ""}₹{Math.abs(row.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}