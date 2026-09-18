import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Users } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import UserRow from "./components/UserRow";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await requireAdmin();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { displayName: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      profile: true,
      wallet: true,
      _count: { select: { matches: true, reportsReceived: true } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Users</h1>
      <p className="text-sm text-muted-foreground mb-5">
        {users.length} user{users.length !== 1 ? "s" : ""}
        {query ? ` matching “${query}”` : ""}
      </p>

      <form method="GET" className="mb-5">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name, username or email..."
          className="w-full max-w-md px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
        />
      </form>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search." />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={{
                id: u.id,
                username: u.username,
                displayName: u.displayName,
                email: u.email,
                avatar: u.avatar,
                role: u.role,
                status: u.status,
                creditScore: u.creditScore,
                isVerified: u.profile?.isVerified ?? false,
                balance: u.wallet ? Number(u.wallet.balance.toString()) : 0,
                frozenBalance: u.wallet ? Number(u.wallet.frozenBalance.toString()) : 0,
                matches: u._count.matches,
                reports: u._count.reportsReceived,
                createdAt: u.createdAt.toISOString(),
              }}
              isSelf={u.id === admin.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}