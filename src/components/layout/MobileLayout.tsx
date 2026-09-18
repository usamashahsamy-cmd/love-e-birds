import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteLogo } from "@/lib/site-settings";
import TopHeader from "./TopHeader";
import BottomNavigation from "./BottomNavigation";

interface MobileLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export default async function MobileLayout({ children, showHeader = true }: MobileLayoutProps) {
  let unreadCount = 0;
  let messageCount = 0;
  const logo = await getSiteLogo();
  if (showHeader) {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      [unreadCount, messageCount] = await Promise.all([
        prisma.notification.count({ where: { userId: session.user.id, read: false } }),
        countUnreadMessages(session.user.id),
      ]);
    }
  }

  return (
    <div className="flex flex-col min-h-screen max-w-[565px] mx-auto bg-background relative w-full">
      {showHeader ? <TopHeader unreadCount={unreadCount} messageCount={messageCount} logoUrl={logo.url} /> : null}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      <BottomNavigation />
    </div>
  );
}

async function countUnreadMessages(userId: string) {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  let total = 0;
  for (const m of memberships) {
    total += await prisma.message.count({
      where: {
        conversationId: m.conversationId,
        NOT: { senderId: userId },
        createdAt: { gt: m.lastReadAt ?? new Date(0) },
      },
    });
  }
  return total;
}