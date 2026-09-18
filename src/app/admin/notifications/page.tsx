import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import NotificationForm from "./components/NotificationForm";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    select: { id: true, displayName: true, username: true },
    orderBy: { displayName: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Notifications</h1>
      <p className="text-sm text-muted-foreground mb-5">Send system notifications to any user or all users.</p>
      <NotificationForm users={users} />
    </div>
  );
}
