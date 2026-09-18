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

export async function freezeBalance(userId: string, amount: number) {
  const admin = await requireAdmin();
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Amount must be greater than 0" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found");
      const available = toNumber(wallet.balance) - toNumber(wallet.frozenBalance);
      if (amount > available) throw new Error("Insufficient available balance");

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { frozenBalance: { increment: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ADMIN_ADJUSTMENT",
          amount,
          direction: "DEBIT",
          description: `Admin froze ₹${amount}`,
          balanceAfter: toNumber(updated.balance),
        },
      });

      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: "FREEZE_BALANCE",
          entityType: "Wallet",
          entityId: wallet.id,
          details: { userId, amount },
        },
      });
    });

    revalidatePath("/admin/balances");
    revalidatePath("/admin/users");
    revalidatePath("/mine");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to freeze balance" };
  }
}

export async function deductBalance(userId: string, amount: number, reason?: string) {
  const admin = await requireAdmin();
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Amount must be greater than 0" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found");
      const available = toNumber(wallet.balance) - toNumber(wallet.frozenBalance);
      if (amount > available) throw new Error("Insufficient available balance");

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ADMIN_ADJUSTMENT",
          amount,
          direction: "DEBIT",
          description: reason?.trim() ? `Admin deduction: ${reason.trim()}` : `Admin deducted ₹${amount}`,
          balanceAfter: toNumber(updated.balance),
        },
      });

      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: "DEDUCT_BALANCE",
          entityType: "Wallet",
          entityId: wallet.id,
          details: { userId, amount, reason: reason ?? null },
        },
      });
    });

    revalidatePath("/admin/balances");
    revalidatePath("/admin/users");
    revalidatePath("/mine");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to deduct balance" };
  }
}

export async function unfreezeBalance(userId: string, amount: number) {
  const admin = await requireAdmin();
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Amount must be greater than 0" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found");
      if (amount > toNumber(wallet.frozenBalance)) throw new Error("Amount exceeds frozen balance");

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { frozenBalance: { decrement: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ADMIN_ADJUSTMENT",
          amount,
          direction: "CREDIT",
          description: `Admin unfroze ₹${amount}`,
          balanceAfter: toNumber(updated.balance),
        },
      });

      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: "UNFREEZE_BALANCE",
          entityType: "Wallet",
          entityId: wallet.id,
          details: { userId, amount },
        },
      });
    });

    revalidatePath("/admin/balances");
    revalidatePath("/admin/users");
    revalidatePath("/mine");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to unfreeze balance" };
  }
}
