import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Wallet } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import BalanceRow from "./components/BalanceRow";

export const dynamic = "force-dynamic";

export default async function AdminBalancesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: {
      role: "USER",
      ...(query
        ? {
            OR: [
              { displayName: { contains: query, mode: "insensitive" } },
              { username: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { wallet: true },
  });

  const totalBalance = users.reduce((sum, u) => sum + (u.wallet ? Number(u.wallet.balance.toString()) : 0), 0);
  const totalFrozen = users.reduce((sum, u) => sum + (u.wallet ? Number(u.wallet.frozenBalance.toString()) : 0), 0);

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">User Balances</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Manage user wallet balances. Freeze, deduct, or unfreeze amounts.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card border border-card-border rounded-2xl p-4">
          <p className="text-[11px] text-muted-foreground">Total Balance</p>
          <p className="text-lg font-bold">₹{totalBalance.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-card border border-card-border rounded-2xl p-4">
          <p className="text-[11px] text-muted-foreground">Total Frozen</p>
          <p className="text-lg font-bold">₹{totalFrozen.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <form method="GET" className="mb-5">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name, username or email..."
          className="w-full max-w-md px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
        />
      </form>

      {users.length === 0 ? (
        <EmptyState icon={Wallet} title="No users found" description="Try a different search." />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <BalanceRow
              key={u.id}
              user={{
                id: u.id,
                username: u.username,
                displayName: u.displayName,
                email: u.email,
                balance: u.wallet ? Number(u.wallet.balance.toString()) : 0,
                frozenBalance: u.wallet ? Number(u.wallet.frozenBalance.toString()) : 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
