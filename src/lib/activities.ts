import { prisma } from "@/lib/prisma";

export type ActivityStatus = "UPCOMING" | "ACTIVE" | "ENDING" | "ENDED";

const ENDING_SOON_MS = 30 * 60 * 1000;

export function computeActivityStatus(
  activity: { active: boolean; startAt: Date; endAt: Date },
  now: Date = new Date()
): ActivityStatus {
  if (!activity.active) return "ENDED";
  if (now < activity.startAt) return "UPCOMING";
  if (now >= activity.endAt) return "ENDED";
  if (activity.endAt.getTime() - now.getTime() <= ENDING_SOON_MS) return "ENDING";
  return "ACTIVE";
}

export function serializeActivity(activity: {
  id: string;
  slug: string;
  title: string;
  startAt: Date;
  endAt: Date;
  maxQuantity: number;
  active: boolean;
}) {
  return {
    id: activity.id,
    slug: activity.slug,
    title: activity.title,
    startAt: activity.startAt.toISOString(),
    endAt: activity.endAt.toISOString(),
    maxQuantity: activity.maxQuantity,
    active: activity.active,
    status: computeActivityStatus(activity),
  };
}

export async function getActivityByIdOrSlug(idOrSlug: string) {
  return prisma.activity.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
}
