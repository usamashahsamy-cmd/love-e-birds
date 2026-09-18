"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rechargeSchema, withdrawSchema, paymentMethodSchema } from "@/lib/validations";
import { encryptDetails, maskDetails } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

function toNumber(value: unknown): number {
  if (value instanceof Object && "toString" in (value as object)) {
    return Number((value as { toString(): string }).toString());
  }
  return Number(value);
}

export async function rechargeWallet(input: { amount: number; paymentMethod: string }) {
  const userId = await requireUser();
  const parsed = rechargeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      await tx.recharge.create({
        data: {
          userId,
          amount: parsed.data.amount,
          paymentMethod: parsed.data.paymentMethod,
          status: "PENDING",
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: "WALLET",
          title: `Recharge request submitted`,
          content: `₹${parsed.data.amount} via ${parsed.data.paymentMethod} is pending admin approval.`,
          link: "/mine/recharge",
        },
      });
    });

    revalidatePath("/mine");
    revalidatePath("/mine/points-history");
    revalidatePath("/admin/recharges");
    return { success: true, pending: true };
  } catch {
    return { success: false, error: "Recharge request failed. Please try again." };
  }
}

export async function withdrawWallet(input: { amount: number; paymentMethodId: string }) {
  const userId = await requireUser();
  const parsed = withdrawSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const method = await prisma.paymentMethod.findUnique({
    where: { id: parsed.data.paymentMethodId },
  });
  if (!method || method.userId !== userId) {
    return { success: false, error: "Select a valid payment method" };
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const balance = wallet ? toNumber(wallet.balance) : 0;
  const frozen = wallet ? toNumber(wallet.frozenBalance) : 0;
  if (parsed.data.amount > balance - frozen) {
    return { success: false, error: "Insufficient balance" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: wallet!.id },
        data: {
          balance: { decrement: parsed.data.amount },
          frozenBalance: { increment: parsed.data.amount },
        },
      });
      const balanceAfter = toNumber(updated.balance);

      await tx.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          type: "WITHDRAWAL",
          amount: parsed.data.amount,
          direction: "DEBIT",
          description: `Withdrawal to ${method.label}`,
          balanceAfter,
        },
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount: parsed.data.amount,
          paymentMethodId: method.id,
          status: "PENDING",
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: "WALLET",
          title: "Withdrawal submitted",
          content: `₹${parsed.data.amount} withdrawal is pending approval.`,
          link: "/mine/withdraw-details",
        },
      });

      void withdrawal;
    });

    revalidatePath("/mine");
    revalidatePath("/mine/points-history");
    return { success: true };
  } catch {
    return { success: false, error: "Withdrawal failed. Please try again." };
  }
}

export async function addPaymentMethod(input: {
  type: "UPI" | "BANK_CARD" | "BANK_ACCOUNT" | "WALLET";
  label: string;
  details: string;
}) {
  const userId = await requireUser();
  const parsed = paymentMethodSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const existing = await prisma.paymentMethod.count({ where: { userId } });
  const isDefault = existing === 0;

  await prisma.paymentMethod.create({
    data: {
      userId,
      type: parsed.data.type,
      label: parsed.data.label,
      detailsEncrypted: encryptDetails(parsed.data.details),
      maskedDetails: maskDetails(parsed.data.type, parsed.data.details),
      isDefault,
    },
  });

  revalidatePath("/mine/my-bank");
  revalidatePath("/mine/withdraw-details");
  return { success: true };
}

export async function deletePaymentMethod(id: string) {
  const userId = await requireUser();
  const method = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!method || method.userId !== userId) {
    return { success: false, error: "Payment method not found" };
  }

  const withdrawalCount = await prisma.withdrawal.count({
    where: { paymentMethodId: id },
  });
  if (withdrawalCount > 0) {
    return {
      success: false,
      error: "This method is linked to withdrawals and can't be removed",
    };
  }

  await prisma.paymentMethod.delete({ where: { id } });

  const hadDefault = method.isDefault;
  if (hadDefault) {
    const next = await prisma.paymentMethod.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.paymentMethod.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  revalidatePath("/mine/my-bank");
  revalidatePath("/mine/withdraw-details");
  return { success: true };
}

export async function setDefaultPaymentMethod(id: string) {
  const userId = await requireUser();
  const method = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!method || method.userId !== userId) {
    return { success: false, error: "Payment method not found" };
  }

  await prisma.$transaction([
    prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.paymentMethod.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/mine/my-bank");
  return { success: true };
}