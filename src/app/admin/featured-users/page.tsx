import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import FeaturedUsersList from "./components/FeaturedUsersList";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    where: { role: "USER", status: "ACTIVE" },
    select: { id: true, displayName: true, username: true, avatar: true, isFeatured: true },
    orderBy: [{ isFeatured: "desc" }, { displayName: "asc" }],
    take: 200,
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Featured Users</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Select users to display on the home page featured section.
      </p>
      <FeaturedUsersList users={users} />
    </div>
  );
}
