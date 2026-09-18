import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Clock, Eye } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import WatchHistoryList from "./components/WatchHistoryList";

export const dynamic = "force-dynamic";

export default async function WatchHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const history = await prisma.watchHistory.findMany({
    where: { viewerId: session.user.id },
    orderBy: { viewedAt: "desc" },
    take: 100,
    include: { profile: { include: { user: true } } },
  });

  if (history.length === 0) {
    return (
      <div className="px-4 pt-4 pb-6">
        <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock size={20} className="text-primary" /> Watch History
        </h1>
        <EmptyState
          icon={Eye}
          title="No viewing history"
          description="Profiles you've viewed will appear here."
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Clock size={20} className="text-primary" /> Watch History
      </h1>
      <p className="text-[11px] text-muted-foreground mb-4">
        Profiles you&apos;ve visited recently.
      </p>
      <WatchHistoryList
        items={history.map((h) => ({
          id: h.id,
          username: h.profile.user.username,
          displayName: h.profile.user.displayName,
          avatar: h.profile.user.avatar,
          location: h.profile.location,
          viewedAt: h.viewedAt.toISOString(),
        }))}
      />
    </div>
  );
}