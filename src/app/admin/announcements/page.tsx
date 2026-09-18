import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Megaphone } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import AnnouncementRow from "./components/AnnouncementRow";
import CreateAnnouncementForm from "./components/CreateAnnouncementForm";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { reads: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Announcements</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Broadcast messages shown in users&apos; announcement feed. The latest active announcement scrolls as a sticky note on the home page.
      </p>

      <CreateAnnouncementForm />

      {announcements.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Megaphone}
            title="No announcements"
            description="Create your first announcement."
          />
        </div>
      ) : (
        <div className="space-y-3 mt-6">
          {announcements.map((a) => (
            <AnnouncementRow
              key={a.id}
              announcement={{
                id: a.id,
                title: a.title,
                content: a.content,
                target: a.target,
                isActive: a.isActive,
                reads: a._count.reads,
                createdAt: a.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}