import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Ticket } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ParticipationRow from "./components/ParticipationRow";

export const dynamic = "force-dynamic";

export default async function AdminActivityParticipationsPage() {
  await requireAdmin();

  const participations = await prisma.activityParticipation.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      activity: { select: { title: true, slug: true } },
      product: { select: { name: true, imageUrl: true } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Activity Participations</h1>
      <p className="text-sm text-muted-foreground mb-5">
        See which users bought tickets for which products and activities.
      </p>

      {participations.length === 0 ? (
        <EmptyState icon={Ticket} title="No participations yet" description="Users haven&apos;t joined any activities." />
      ) : (
        <div className="space-y-3">
          {participations.map((p) => (
            <ParticipationRow
              key={p.id}
              participation={{
                id: p.id,
                user: p.user,
                activity: p.activity,
                product: p.product,
                quantity: p.quantity,
                ticketCost: p.ticketCost,
                totalCost: p.totalCost,
                status: p.status,
                createdAt: p.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
