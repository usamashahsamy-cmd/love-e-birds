import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ShieldCheck } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import VerificationCard from "./components/VerificationCard";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  await requireAdmin();

  const verifications = await prisma.verification.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { user: { include: { profile: true } } },
  });

  if (verifications.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-5">Verifications</h1>
        <EmptyState
          icon={ShieldCheck}
          title="No verification requests"
          description="Submitted identity requests will appear here."
        />
      </div>
    );
  }

  const statusOrder = ["PENDING", "REJECTED", "APPROVED"];
  const sorted = [...verifications].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Verifications</h1>
      <p className="text-sm text-muted-foreground mb-5">Review identity documents.</p>
      <div className="space-y-4">
        {sorted.map((v) => (
          <VerificationCard
            key={v.id}
            item={{
              id: v.id,
              status: v.status,
              fullName: v.fullName,
              idType: v.idType,
              documentUrl: v.documentUrl,
              selfieUrl: v.selfieUrl,
              notes: v.notes,
              createdAt: v.createdAt.toISOString(),
              user: {
                id: v.user.id,
                username: v.user.username,
                displayName: v.user.displayName,
                email: v.user.email,
                avatar: v.user.avatar,
                isVerified: v.user.profile?.isVerified ?? false,
              },
            }}
          />
        ))}
      </div>
    </div>
  );
}