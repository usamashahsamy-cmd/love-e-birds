import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Banknote } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import WithdrawalRow from "./components/WithdrawalRow";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
  await requireAdmin();

  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      user: true,
      paymentMethod: true,
    },
  });

  if (withdrawals.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-5">Withdrawals</h1>
        <EmptyState
          icon={Banknote}
          title="No withdrawals"
          description="User payout requests will appear here."
        />
      </div>
    );
  }

  const statusOrder = ["PENDING", "PROCESSING", "APPROVED", "COMPLETED", "REJECTED"];
  const sorted = [...withdrawals].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Withdrawals</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Approve payout requests (releases withheld funds) or reject (refunds the user).
      </p>
      <div className="space-y-3">
        {sorted.map((w) => (
          <WithdrawalRow
            key={w.id}
            item={{
              id: w.id,
              amount: Number(w.amount.toString()),
              status: w.status,
              accountNote: w.accountNote,
              createdAt: w.createdAt.toISOString(),
              updatedAt: w.updatedAt.toISOString(),
              user: {
                username: w.user.username,
                displayName: w.user.displayName,
                email: w.user.email,
              },
              method: w.paymentMethod.maskedDetails,
              methodType: w.paymentMethod.type,
            }}
          />
        ))}
      </div>
    </div>
  );
}