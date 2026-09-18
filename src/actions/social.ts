"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema, type ReportInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

async function ensureConversation(userA: string, userB: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      members: {
        every: { userId: { in: [userA, userB] } },
      },
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const conversation = await prisma.conversation.create({
    data: {
      type: "DIRECT",
      members: {
        create: [{ userId: userA }, { userId: userB }],
      },
    },
    select: { id: true },
  });
  return conversation.id;
}

export async function likeProfile(targetUserId: string) {
  const userId = await requireUser();
  if (userId === targetUserId) return { success: false, error: "You cannot like yourself" };

  const existing = await prisma.like.findUnique({
    where: { senderId_receiverId: { senderId: userId, receiverId: targetUserId } },
  });
  if (existing) return { success: true, alreadyLiked: true };

  const [like] = await prisma.$transaction([
    prisma.like.create({
      data: { senderId: userId, receiverId: targetUserId },
    }),
    prisma.user.update({
      where: { id: targetUserId },
      data: { profile: { update: { likesCount: { increment: 1 } } } },
      select: { id: true },
    }),
  ]);

  const mutual = await prisma.like.findUnique({
    where: { senderId_receiverId: { senderId: targetUserId, receiverId: userId } },
  });

  let matched = false;
  if (mutual) {
    await ensureConversation(userId, targetUserId);

    await prisma.$transaction([
      prisma.match.upsert({
        where: { userId_targetId: { userId, targetId: targetUserId } },
        update: {},
        create: { userId, targetId: targetUserId },
      }),
      prisma.match.upsert({
        where: { userId_targetId: { userId: targetUserId, targetId: userId } },
        update: {},
        create: { userId: targetUserId, targetId: userId },
      }),
      prisma.notification.create({
        data: {
          userId: userId,
          type: "MATCH",
          title: "It's a match! 🎉",
          content: "You matched with someone. Say hello!",
          link: `/profile/${targetUserId}`,
        },
      }),
    ]);
    matched = true;
  } else {
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "LIKE",
        title: "You got a new like!",
        content: "Someone liked your profile.",
        link: `/profile/${userId}`,
      },
    });
  }

  revalidatePath("/home");
  revalidatePath("/match");
  return { success: true, matched, likeId: like.id };
}

export async function unlikeProfile(targetUserId: string) {
  const userId = await requireUser();
  await prisma.$transaction([
    prisma.like.deleteMany({
      where: { senderId: userId, receiverId: targetUserId },
    }),
    prisma.user.update({
      where: { id: targetUserId },
      data: { profile: { update: { likesCount: { decrement: 1 } } } },
    }),
  ]);
  revalidatePath("/home");
  revalidatePath("/match");
  return { success: true };
}

export async function followProfile(targetUserId: string) {
  const userId = await requireUser();
  if (userId === targetUserId) return { success: false, error: "You cannot follow yourself" };

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
  });
  if (existing) return { success: true, alreadyFollowing: true };

  await prisma.follow.create({
    data: { followerId: userId, followingId: targetUserId },
  });
  revalidatePath("/home");
  return { success: true };
}

export async function unfollowProfile(targetUserId: string) {
  const userId = await requireUser();
  await prisma.follow.deleteMany({
    where: { followerId: userId, followingId: targetUserId },
  });
  revalidatePath("/home");
  return { success: true };
}

export async function blockProfile(targetUserId: string) {
  const userId = await requireUser();
  if (userId === targetUserId) return { success: false, error: "Invalid action" };

  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetUserId } },
      update: {},
      create: { blockerId: userId, blockedId: targetUserId },
    }),
    prisma.like.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId },
        ],
      },
    }),
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: userId, followingId: targetUserId },
          { followerId: targetUserId, followingId: userId },
        ],
      },
    }),
    prisma.match.deleteMany({
      where: {
        OR: [
          { userId, targetId: targetUserId },
          { userId: targetUserId, targetId: userId },
        ],
      },
    }),
  ]);
  revalidatePath("/home");
  return { success: true };
}

export async function unblockProfile(targetUserId: string) {
  const userId = await requireUser();
  await prisma.block.deleteMany({
    where: { blockerId: userId, blockedId: targetUserId },
  });
  revalidatePath("/home");
  return { success: true };
}

export async function reportProfile(targetUserId: string, input: ReportInput) {
  const userId = await requireUser();
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid report" };
  }
  if (userId === targetUserId) return { success: false, error: "Invalid action" };

  await prisma.report.create({
    data: {
      reporterId: userId,
      targetId: targetUserId,
      type: parsed.data.type,
      reason: parsed.data.reason,
    },
  });
  return { success: true };
}

export async function unmatchProfile(targetUserId: string) {
  const userId = await requireUser();
  if (userId === targetUserId) return { success: false, error: "Invalid action" };

  await prisma.$transaction([
    prisma.match.updateMany({
      where: { userId, targetId: targetUserId, status: "ACTIVE" },
      data: { status: "UNMATCHED" },
    }),
    prisma.match.updateMany({
      where: { userId: targetUserId, targetId: userId, status: "ACTIVE" },
      data: { status: "UNMATCHED" },
    }),
  ]);

  revalidatePath("/match");
  return { success: true };
}

export async function applyForDate(targetUserId: string) {
  const userId = await requireUser();
  if (userId === targetUserId) return { success: false, error: "Invalid action" };

  await prisma.notification.create({
    data: {
      userId: targetUserId,
      type: "DATE",
      title: "Date request",
      content: "Someone would like to go on a date with you!",
    },
  });
  return { success: true };
}