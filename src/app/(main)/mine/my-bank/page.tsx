import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PaymentMethods from "@/components/wallet/PaymentMethods";
import { Landmark } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyBankPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const methods = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: { id: true, type: true, label: true, maskedDetails: true, isDefault: true },
  });

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Landmark size={20} className="text-primary" /> My Bank
      </h1>
      <p className="text-xs text-muted-foreground mb-4">
        Save UPI, cards or bank accounts to withdraw your earnings. Details are stored securely.
      </p>
      <PaymentMethods methods={methods} />
    </div>
  );
}