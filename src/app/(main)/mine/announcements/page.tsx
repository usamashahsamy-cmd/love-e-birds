import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Megaphone } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import AnnouncementList from "./components/AnnouncementList";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [announcements, reads] = await Promise.all([
    prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.announcementRead.findMany({
      where: { userId: session.user.id },
      select: { announcementId: true },
    }),
  ]);

  const readSet = new Set(reads.map((r) => r.announcementId));

  if (announcements.length === 0) {
    return (
      <div className="px-4 pt-4 pb-6">
        <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Megaphone size={20} className="text-warning" /> Announcements
        </h1>
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description="System announcements will appear here."
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Megaphone size={20} className="text-warning" /> Announcements
      </h1>
      <AnnouncementList
        items={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          createdAt: a.createdAt.toISOString(),
          read: readSet.has(a.id),
        }))}
      />
    </div>
  );
}