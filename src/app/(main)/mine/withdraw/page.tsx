import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WithdrawForm from "@/components/wallet/WithdrawForm";
import { ArrowUpFromLine } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WithdrawPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [wallet, methods] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.paymentMethod.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
      select: { id: true, label: true, maskedDetails: true, type: true },
    }),
  ]);

  const balance = wallet?.balance ? Number(wallet.balance.toString()) : 0;
  const frozen = wallet?.frozenBalance ? Number(wallet.frozenBalance.toString()) : 0;
  const withdrawable = Math.max(0, balance - frozen);

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <ArrowUpFromLine size={20} className="text-accent-dark" /> Withdraw
      </h1>
      <div className="bg-card border border-card-border rounded-2xl p-4 mb-5 space-y-2.5">
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Total Balance</span>
          <span className="text-sm font-semibold">₹{balance.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Frozen (pending withdrawals)</span>
          <span className="text-sm font-semibold text-muted-foreground">
            ₹{frozen.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex justify-between border-t border-card-border pt-2.5">
          <span className="text-xs text-muted-foreground">Withdrawable</span>
          <span className="text-sm font-bold text-primary">₹{withdrawable.toLocaleString("en-IN")}</span>
        </div>
      </div>
      <WithdrawForm withdrawable={withdrawable} methods={methods} />
    </div>
  );
}