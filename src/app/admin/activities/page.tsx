import { CalendarDays } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import EmptyState from "@/components/ui/EmptyState";
import ActivityForm from "./components/ActivityForm";

export const dynamic = "force-dynamic";

export default async function AdminActivitiesPage() {
  await requireAdmin();

  const activities = await prisma.activity.findMany({
    orderBy: [{ startAt: "desc" }, { id: "asc" }],
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Activities</h1>
      <p className="text-sm text-muted-foreground mb-5">Manage activity schedules, quantities, and availability.</p>

      <ActivityForm />

      {activities.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No activities yet" description="Create the first activity using the form above." />
      ) : (
        <div className="space-y-3 mt-6">
          {activities.map((activity) => (
            <ActivityForm
              key={`${activity.id}:${activity.updatedAt.toISOString()}`}
              activity={{
                id: activity.id,
                title: activity.title,
                slug: activity.slug,
                startAt: activity.startAt.toISOString(),
                endAt: activity.endAt.toISOString(),
                maxQuantity: activity.maxQuantity,
                active: activity.active,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
