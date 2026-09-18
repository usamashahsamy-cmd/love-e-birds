"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

async function areMatched(a: string, b: string) {
  const count = await prisma.match.count({
    where: {
      status: "ACTIVE",
      OR: [
        { userId: a, targetId: b },
        { userId: b, targetId: a },
      ],
    },
  });
  return count > 0;
}

async function ensureConversation(tx: Prisma.TransactionClient, userA: string, userB: string) {
  const existing = await tx.conversation.findFirst({
    where: {
      type: "DIRECT",
      members: {
        every: { userId: { in: [userA, userB] } },
      },
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const conversation = await tx.conversation.create({
    data: { type: "DIRECT" },
    select: { id: true },
  });
  await tx.conversationMember.createMany({
    data: [
      { conversationId: conversation.id, userId: userA },
      { conversationId: conversation.id, userId: userB },
    ],
  });
  return conversation.id;
}

export async function sendMessage(input: { toUsername: string; content: string }) {
  const senderId = await requireUser();
  const content = input.content?.trim();
  if (!content) return { success: false, error: "Message can't be empty" };
  if (content.length > 2000) return { success: false, error: "Message is too long" };

  const target = await prisma.user.findUnique({
    where: { username: input.toUsername },
    select: { id: true, username: true, displayName: true },
  });
  if (!target) return { success: false, error: "User not found" };
  if (target.id === senderId) return { success: false, error: "You can't message yourself" };

  const matched = await areMatched(senderId, target.id);
  if (!matched) return { success: false, error: "You can only message people you're matched with" };

  try {
    await prisma.$transaction(async (tx) => {
      const conversationId = await ensureConversation(tx, senderId, target.id);
      await tx.message.create({
        data: { conversationId, senderId, content },
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      await tx.conversationMember.updateMany({
        where: { conversationId, userId: senderId },
        data: { lastReadAt: new Date() },
      });
    });

    await prisma.notification.create({
      data: {
        userId: target.id,
        type: "MESSAGE",
        title: `New message from ${target.displayName}`,
        content: content.length > 80 ? `${content.slice(0, 80)}…` : content,
        link: `/messages/${target.username}`,
      },
    });

    revalidatePath("/messages");
    revalidatePath(`/messages/${target.username}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send message" };
  }
}

export async function markConversationRead(conversationId: string) {
  const userId = await requireUser();
  await prisma.conversationMember.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  });
  revalidatePath("/messages");
  return { success: true };
}