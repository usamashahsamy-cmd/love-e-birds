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

/* ------------------------------ Selection ------------------------------ */

export async function saveSelection(input: {
  activityId: string;
  productId: string;
  quantity: number;
}) {
  const userId = await requireUser();
  const qty = Math.floor(Number(input.quantity));
  if (!Number.isInteger(qty) || qty < 1) {
    return { success: false, error: "Invalid quantity" };
  }

  const activity = await prisma.activity.findUnique({ where: { id: input.activityId } });
  if (!activity || !activity.active) {
    return { success: false, error: "Activity not available" };
  }
  if (qty > activity.maxQuantity) {
    return { success: false, error: `Maximum quantity is ${activity.maxQuantity}` };
  }

  const link = await prisma.activityProduct.findUnique({
    where: { activityId_productId: { activityId: input.activityId, productId: input.productId } },
    include: { product: true },
  });
  if (!link || !link.product.active) {
    return { success: false, error: "Product not available" };
  }

  await prisma.productSelection.upsert({
    where: { userId_activityId: { userId, activityId: input.activityId } },
    update: { productId: input.productId, quantity: qty },
    create: { userId, activityId: input.activityId, productId: input.productId, quantity: qty },
  });

  return { success: true };
}

/* ---------------------------- Participation ---------------------------- */

export async function participate(input: {
  activityId: string;
  productId: string;
  quantity: number;
}) {
  const userId = await requireUser();
  const qty = Math.floor(Number(input.quantity));
  if (!Number.isInteger(qty) || qty < 1) {
    return { success: false, error: "Invalid quantity" };
  }

  const activity = await prisma.activity.findUnique({ where: { id: input.activityId } });
  if (!activity || !activity.active) {
    return { success: false, error: "Activity not available" };
  }

  const now = new Date();
  if (now < activity.startAt) {
    return { success: false, error: "Activity has not started yet" };
  }
  if (now >= activity.endAt) {
    return { success: false, error: "Activity has ended" };
  }
  if (qty > activity.maxQuantity) {
    return { success: false, error: `Maximum quantity is ${activity.maxQuantity}` };
  }

  const link = await prisma.activityProduct.findUnique({
    where: { activityId_productId: { activityId: input.activityId, productId: input.productId } },
    include: { product: true },
  });
  if (!link || !link.product.active) {
    return { success: false, error: "Product not available" };
  }

  const product = link.product;
  const ticketCost = product.ticketCost;
  const totalCost = ticketCost * qty;

  const existing = await prisma.activityParticipation.findUnique({
    where: { activityId_userId: { activityId: input.activityId, userId } },
  });
  if (existing && existing.status !== "CANCELLED") {
    return { success: false, error: "You have already participated in this activity" };
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const balance = wallet ? toNumber(wallet.balance) : 0;
  if (balance < totalCost) {
    return { success: false, error: "Insufficient balance. Recharge your wallet first." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      const updated = await tx.wallet.update({
        where: { id: w.id },
        data: {
          balance: { decrement: totalCost },
          totalSpent: { increment: totalCost },
        },
      });
      const balanceAfter = toNumber(updated.balance);

      const participation = existing
        ? await tx.activityParticipation.update({
            where: { id: existing.id },
            data: {
              productId: product.id,
              quantity: qty,
              ticketCost,
              totalCost,
              status: "CONFIRMED",
            },
          })
        : await tx.activityParticipation.create({
            data: {
              activityId: input.activityId,
              userId,
              productId: product.id,
              quantity: qty,
              ticketCost,
              totalCost,
              status: "CONFIRMED",
            },
          });

      await tx.walletTransaction.create({
        data: {
          walletId: w.id,
          type: "ACTIVITY_ENTRY",
          amount: totalCost,
          direction: "DEBIT",
          description: `Activity entry: ${activity.title} - ${product.name} x${qty}`,
          balanceAfter,
          referenceId: participation.id,
        },
      });

      await tx.activityHistory.create({
        data: {
          userId,
          activityId: activity.id,
          productId: product.id,
          participationId: participation.id,
          activityTitle: activity.title,
          productName: product.name,
          quantity: qty,
          ticketsUsed: totalCost,
          status: "CONFIRMED",
        },
      });

      await tx.productSelection.deleteMany({
        where: { userId, activityId: input.activityId },
      });

      return { participationId: participation.id, balanceAfter };
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "WALLET",
        title: "Activity participation confirmed",
        content: `${activity.title}: ${product.name} x${qty} (${totalCost} tickets used).`,
        link: "/activities/history",
      },
    });

    revalidatePath(`/activities/${activity.slug}`);
    revalidatePath("/activities/history");
    revalidatePath("/mine");
    return { success: true, participationId: result.participationId, balanceAfter: result.balanceAfter };
  } catch {
    return { success: false, error: "Failed to confirm participation. Please try again." };
  }
}

/* ------------------------------- History ------------------------------- */

export async function getActivityHistory(input: { page?: number; pageSize?: number }) {
  const userId = await requireUser();
  const page = Math.max(1, Math.floor(Number(input.page ?? 1)));
  const pageSize = Math.min(50, Math.max(1, Math.floor(Number(input.pageSize ?? 10))));

  const [total, rows] = await Promise.all([
    prisma.activityHistory.count({ where: { userId } }),
    prisma.activityHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    success: true,
    total,
    page,
    pageSize,
    rows: rows.map((r) => ({
      id: r.id,
      activityTitle: r.activityTitle,
      productName: r.productName,
      quantity: r.quantity,
      ticketsUsed: r.ticketsUsed,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
