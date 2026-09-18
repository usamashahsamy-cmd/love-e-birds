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

export async function markAnnouncementRead(announcementId: string) {
  const userId = await requireUser();
  await prisma.announcementRead.upsert({
    where: {
      announcementId_userId: { announcementId, userId },
    },
    update: {},
    create: { announcementId, userId },
  });
  revalidatePath("/mine/announcements");
  return { success: true };
}