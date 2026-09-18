"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function sendNotification(input: {
  userId?: string;
  allUsers?: boolean;
  title: string;
  content: string;
  link?: string;
}) {
  const admin = await requireAdmin();

  if (!input.title.trim() || !input.content.trim()) {
    return { success: false, error: "Title and content are required" };
  }

  try {
    if (input.allUsers) {
      const users = await prisma.user.findMany({ where: { role: "USER" }, select: { id: true } });
      await prisma.$transaction(async (tx) => {
        await tx.notification.createMany({
          data: users.map((u) => ({
            userId: u.id,
            type: "SYSTEM",
            title: input.title.trim(),
            content: input.content.trim(),
            link: input.link?.trim() || null,
          })),
        });
        await tx.adminAction.create({
          data: {
            adminId: admin.id,
            action: "SEND_NOTIFICATION_ALL",
            entityType: "Notification",
            details: { recipients: users.length, title: input.title.trim() },
          },
        });
      });
    } else if (input.userId) {
      await prisma.$transaction(async (tx) => {
        await tx.notification.create({
          data: {
            userId: input.userId!,
            type: "SYSTEM",
            title: input.title.trim(),
            content: input.content.trim(),
            link: input.link?.trim() || null,
          },
        });
        await tx.adminAction.create({
          data: {
            adminId: admin.id,
            action: "SEND_NOTIFICATION_USER",
            entityType: "Notification",
            entityId: input.userId,
            details: { title: input.title.trim() },
          },
        });
      });
    } else {
      return { success: false, error: "Select a user or choose all users" };
    }

    revalidatePath("/admin/notifications");
    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send notification" };
  }
}
