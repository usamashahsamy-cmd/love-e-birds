"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

export async function markNotificationRead(id: string) {
  const userId = await requireUser();
  await prisma.notification.updateMany({
    where: { id, userId, read: false },
    data: { read: true },
  });
  return { success: true };
}

export async function markAllNotificationsRead() {
  const userId = await requireUser();
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { success: true };
}