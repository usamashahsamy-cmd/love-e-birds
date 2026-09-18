import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Ticket } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ReferralCodeForm from "./components/ReferralCodeForm";
import ReferralCodeRow from "./components/ReferralCodeRow";

export const dynamic = "force-dynamic";

export default async function AdminReferralCodesPage() {
  await requireAdmin();

  const codes = await prisma.referralCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Referral Codes</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Create and manage referral codes. New users must enter a valid code to sign up.
      </p>

      <div className="mb-6">
        <ReferralCodeForm />
      </div>

      {codes.length === 0 ? (
        <EmptyState icon={Ticket} title="No referral codes" description="Create a code to allow signups." />
      ) : (
        <div className="space-y-3">
          {codes.map((c) => (
            <ReferralCodeRow
              key={c.id}
              code={{
                id: c.id,
                code: c.code,
                maxUses: c.maxUses,
                usedCount: c.usedCount,
                active: c.active,
                createdAt: c.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
