import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { decryptDetails } from "@/lib/encryption";
import { Landmark } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import BankRow from "./components/BankRow";

export const dynamic = "force-dynamic";

export default async function AdminBanksPage() {
  await requireAdmin();

  const methods = await prisma.paymentMethod.findMany({
    orderBy: [{ user: { displayName: "asc" } }, { createdAt: "desc" }],
    include: { user: true },
    take: 500,
  });

  const rows = methods.map((m) => {
    let decrypted = "";
    try {
      decrypted = decryptDetails(m.detailsEncrypted);
    } catch {
      decrypted = "";
    }

    return {
      id: m.id,
      type: m.type,
      label: m.label,
      maskedDetails: m.maskedDetails,
      isDefault: m.isDefault,
      createdAt: m.createdAt.toISOString(),
      bankName: m.bankName ?? "",
      accountHolder: m.accountHolder ?? "",
      ifscCode: m.ifscCode ?? "",
      value: decrypted,
      user: {
        id: m.user.id,
        displayName: m.user.displayName,
        username: m.user.username,
        email: m.user.email,
      },
    };
  });

  if (rows.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-5">Bank Details</h1>
        <EmptyState
          icon={Landmark}
          title="No bank details"
          description="Payment methods added by users will appear here."
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Bank Details</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Every bank account and UPI ID users have added for deposits and withdrawals.
      </p>
      <div className="space-y-3">
        {rows.map((row) => (
          <BankRow key={row.id} item={row} />
        ))}
      </div>
    </div>
  );
}