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

function toNumber(value: unknown): number {
  if (value instanceof Object && "toString" in (value as object)) {
    return Number((value as { toString(): string }).toString());
  }
  return Number(value);
}

export async function reviewRecharge(rechargeId: string, action: "APPROVED" | "CANCELLED") {
  const admin = await requireAdmin();

  const recharge = await prisma.recharge.findUnique({
    where: { id: rechargeId },
    include: { user: { include: { wallet: true } } },
  });

  if (!recharge || recharge.status !== "PENDING") {
    return { success: false, error: "Recharge not found or already processed" };
  }
  if (!recharge.user.wallet) {
    return { success: false, error: "User wallet not found" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.recharge.update({
        where: { id: rechargeId },
        data: {
          status: action === "APPROVED" ? "COMPLETED" : "CANCELLED",
        },
      });

      if (action === "APPROVED") {
        const updated = await tx.wallet.update({
          where: { id: recharge.user.wallet!.id },
          data: { balance: { increment: recharge.amount } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: recharge.user.wallet!.id,
            type: "RECHARGE",
            amount: toNumber(recharge.amount),
            direction: "CREDIT",
            description: `Recharge via ${recharge.paymentMethod} (approved)`,
            balanceAfter: toNumber(updated.balance),
          },
        });
      }

      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: action === "APPROVED" ? "APPROVE_RECHARGE" : "REJECT_RECHARGE",
          entityType: "Recharge",
          entityId: rechargeId,
          details: { userId: recharge.userId, amount: toNumber(recharge.amount) },
        },
      });

      await tx.notification.create({
        data: {
          userId: recharge.userId,
          type: "WALLET",
          title: action === "APPROVED" ? "Recharge approved" : "Recharge rejected",
          content:
            action === "APPROVED"
              ? `₹${Number(recharge.amount).toLocaleString("en-IN")} has been added to your wallet.`
              : `Your recharge request of ₹${Number(recharge.amount).toLocaleString("en-IN")} was rejected.`,
          link: "/mine/recharge",
        },
      });
    });

    revalidatePath("/admin/recharges");
    revalidatePath("/mine");
    revalidatePath("/mine/recharge");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to process recharge" };
  }
}
