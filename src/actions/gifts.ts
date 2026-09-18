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

function toNumber(value: unknown): number {
  return Number((value as { toString(): string }).toString());
}

export async function sendGift(input: { giftId: string; receiverId: string; message?: string }) {
  const senderId = await requireUser();
  if (senderId === input.receiverId) {
    return { success: false, error: "You can't send a gift to yourself" };
  }

  const gift = await prisma.gift.findUnique({
    where: { id: input.giftId },
  });
  if (!gift || !gift.isActive) {
    return { success: false, error: "Gift not available" };
  }

  const receiver = await prisma.user.findUnique({
    where: { id: input.receiverId },
    include: { profile: true },
  });
  if (!receiver) {
    return { success: false, error: "Recipient not found" };
  }

  const cost = toNumber(gift.value);
  const points = Math.floor(cost);

  const senderWallet = await prisma.wallet.findUnique({ where: { userId: senderId } });
  const balance = senderWallet ? toNumber(senderWallet.balance) : 0;
  if (balance < cost) {
    return { success: false, error: "Insufficient balance. Recharge your wallet first." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId: senderId } });
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: cost },
          totalSpent: { increment: cost },
        },
      });
      const balanceAfter = toNumber(updated.balance);

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "GIFT_SENT",
          amount: cost,
          direction: "DEBIT",
          description: `Gift sent: ${gift.name}`,
          balanceAfter,
        },
      });

      await tx.giftTransaction.create({
        data: {
          giftId: gift.id,
          senderId,
          receiverId: input.receiverId,
          points,
          value: cost,
          message: input.message?.trim() ? input.message.trim() : null,
        },
      });

      if (receiver.profile) {
        await tx.profile.update({
          where: { id: receiver.profile.id },
          data: {
            points: { increment: points },
          },
        });
      }
    });

    await prisma.notification.create({
      data: {
        userId: input.receiverId,
        type: "GIFT",
        title: `You received a ${gift.name}! 🎁`,
        content: `${points} points added to your profile.`,
        link: "/mine/gift-record",
      },
    });

    revalidatePath("/mine");
    revalidatePath("/mine/gift-record");
    revalidatePath("/mine/points-history");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send gift. Please try again." };
  }
}