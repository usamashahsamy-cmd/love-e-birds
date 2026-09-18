"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const activitySchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  maxQuantity: z.number().int().min(1).max(1000),
  active: z.boolean(),
}).refine((value) => new Date(value.endAt) > new Date(value.startAt), {
  message: "End time must be after start time",
});

export async function saveActivity(id: string | null, input: unknown) {
  const admin = await requireAdmin();
  const result = activitySchema.safeParse(input);
  if (!result.success) return { success: false, error: result.error.issues[0].message };
  if (id !== null && (typeof id !== "string" || !id.trim())) {
    return { success: false, error: "Invalid activity" };
  }
  const data = {
    ...result.data,
    startAt: new Date(result.data.startAt),
    endAt: new Date(result.data.endAt),
  };
  try {
    await prisma.$transaction(async (tx) => {
      const activity = id
        ? await tx.activity.update({ where: { id }, data })
        : await tx.activity.create({ data });
      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: id ? "UPDATE_ACTIVITY" : "CREATE_ACTIVITY",
          entityType: "Activity",
          entityId: activity.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "This activity slug is already in use" };
    }
    return { success: false, error: "Unable to save activity. Please try again." };
  }
  revalidatePath("/admin/activities");
  return { success: true };
}

export async function extendActivity(id: string, days = 7) {
  const admin = await requireAdmin();
  if (!id.trim()) return { success: false, error: "Invalid activity" };

  try {
    const activity = await prisma.activity.update({
      where: { id },
      data: {
        endAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        active: true,
      },
    });
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: "EXTEND_ACTIVITY",
        entityType: "Activity",
        entityId: activity.id,
        details: { days },
      },
    });
  } catch {
    return { success: false, error: "Unable to extend activity" };
  }

  revalidatePath("/admin/activities");
  revalidatePath(`/activities/${id}`);
  return { success: true };
}
