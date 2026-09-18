import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import UserEditForm from "./components/UserEditForm";

export const dynamic = "force-dynamic";

export default async function AdminUserEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true, wallet: true },
  });

  if (!user) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Edit User</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Update details for @{user.username}
      </p>
      <UserEditForm
        user={{
          id: user.id,
          displayName: user.displayName,
          username: user.username,
          email: user.email,
          phone: user.phone ?? "",
          countryCode: user.countryCode ?? "+91",
          status: user.status,
          creditScore: user.creditScore,
          bio: user.profile?.bio ?? "",
          location: user.profile?.location ?? "",
          avatar: user.avatar,
          balance: user.wallet ? Number(user.wallet.balance.toString()) : 0,
          frozenBalance: user.wallet ? Number(user.wallet.frozenBalance.toString()) : 0,
        }}
      />
    </div>
  );
}
