import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Banknote, Landmark, Clock, CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

const STATUS_UI: Record<string, { label: string; icon: React.ComponentType<{ size?: number | string; className?: string }>; className: string }> = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-700" },
  PROCESSING: { label: "Processing", icon: Loader2, className: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "Approved", icon: CheckCircle2, className: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, className: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rejected", icon: XCircle, className: "bg-red-100 text-red-700" },
};

export default async function WithdrawDetailsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { paymentMethod: true },
    take: 100,
  });

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Banknote size={20} className="text-primary" /> Withdraw Details
      </h1>

      {withdrawals.length === 0 ? (
        <>
          <EmptyState
            icon={Landmark}
            title="No withdrawals yet"
            description="Once you withdraw, your requests will appear here."
          />
          <div className="text-center mt-2">
            <Link href="/mine/withdraw" className="text-sm text-primary font-medium">
              Request a withdrawal →
            </Link>
          </div>
        </>
      ) : (
        <div className="space-y-2.5">
          {withdrawals.map((w) => {
            const status = STATUS_UI[w.status] ?? STATUS_UI.PENDING;
            const StatusIcon = status.icon;
            return (
              <div key={w.id} className="bg-card border border-card-border rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold">
                    ₹{Number(w.amount.toString()).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-1 ${status.className}`}
                  >
                    <StatusIcon size={11} /> {status.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  To {w.paymentMethod.label} · {w.paymentMethod.maskedDetails}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-card-border">
                  <p className="text-[10px] text-muted-foreground">
                    {w.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {w.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {w.referenceId && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <ShieldCheck size={11} /> Ref {w.referenceId}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}