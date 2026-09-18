import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { History } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import RechargeRow from "./components/RechargeRow";

export const dynamic = "force-dynamic";

export default async function AdminRechargesPage() {
  await requireAdmin();

  const [recharges, agg, pendingAgg] = await Promise.all([
    prisma.recharge.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: true },
    }),
    prisma.recharge.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: "COMPLETED" },
    }),
    prisma.recharge.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: "PENDING" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Recharges</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Completed: <span className="font-semibold text-foreground">{agg._count}</span> ·{" "}
        <span className="font-semibold text-foreground">
          ₹{(agg._sum.amount ? Number(agg._sum.amount.toString()) : 0).toLocaleString("en-IN")}
        </span>
        {pendingAgg._count > 0 && (
          <>
            {" · "}
            <span className="font-semibold text-warning">Pending: {pendingAgg._count}</span>
          </>
        )}
      </p>

      {recharges.length === 0 ? (
        <EmptyState icon={History} title="No recharges" description="Recharge history will appear here." />
      ) : (
        <div className="space-y-3">
          {recharges.map((r) => (
            <RechargeRow
              key={r.id}
              recharge={{
                id: r.id,
                amount: Number(r.amount.toString()),
                paymentMethod: r.paymentMethod,
                status: r.status,
                createdAt: r.createdAt.toISOString(),
                user: { displayName: r.user.displayName, username: r.user.username },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
