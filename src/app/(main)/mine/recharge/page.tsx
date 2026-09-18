import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RechargeForm from "@/components/wallet/RechargeForm";
import { ArrowDownToLine, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  PROCESSING: "bg-primary/10 text-primary",
  COMPLETED: "bg-success/10 text-success",
  FAILED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export default async function RechargePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [wallet, pendingRecharges] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
    prisma.recharge.findMany({
      where: { userId: session.user.id, status: { in: ["PENDING", "PROCESSING"] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const walletBalance = wallet?.balance ? Number(wallet.balance.toString()) : 0;

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <ArrowDownToLine size={20} className="text-primary" /> Recharge
      </h1>
      <div className="bg-card border border-card-border rounded-2xl p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Available Balance</p>
          <p className="text-2xl font-bold">
            ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
          <ArrowDownToLine size={20} className="text-white" />
        </div>
      </div>

      {pendingRecharges.length > 0 && (
        <div className="bg-card border border-card-border rounded-2xl p-4 mb-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock size={16} className="text-warning" /> Pending Recharges
          </h2>
          <div className="space-y-2">
            {pendingRecharges.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>₹{Number(r.amount.toString()).toLocaleString("en-IN")}</span>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[r.status]}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <RechargeForm balance={walletBalance} />
    </div>
  );
}