import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NotificationList from "@/components/notifications/NotificationList";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      type: true,
      title: true,
      content: true,
      read: true,
      link: true,
      createdAt: true,
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-4 pt-4">
        <h1 className="text-lg font-bold text-foreground">Notifications</h1>
        {unreadCount > 0 && (
          <span className="text-[11px] bg-accent/10 text-accent-dark font-semibold rounded-full px-2 py-0.5">
            {unreadCount} new
          </span>
        )}
      </div>
      <NotificationList
        notifications={notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
        unreadCount={unreadCount}
      />
    </div>
  );
}