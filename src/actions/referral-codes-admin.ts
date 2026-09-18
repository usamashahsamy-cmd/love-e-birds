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

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function createReferralCode(code: string, maxUses: number = 1) {
  const admin = await requireAdmin();
  const normalized = normalizeCode(code);

  if (!normalized || normalized.length < 3 || normalized.length > 50) {
    return { success: false, error: "Code must be 3-50 characters" };
  }
  if (!Number.isInteger(maxUses) || maxUses < 1) {
    return { success: false, error: "Max uses must be at least 1" };
  }

  try {
    const existing = await prisma.referralCode.findUnique({ where: { code: normalized } });
    if (existing) {
      return { success: false, error: "This code already exists" };
    }

    await prisma.referralCode.create({
      data: {
        code: normalized,
        maxUses,
        createdById: admin.id,
      },
    });

    revalidatePath("/admin/referral-codes");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to create referral code" };
  }
}

export async function toggleReferralCode(id: string, active: boolean) {
  await requireAdmin();
  try {
    await prisma.referralCode.update({ where: { id }, data: { active } });
    revalidatePath("/admin/referral-codes");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update referral code" };
  }
}

export async function deleteReferralCode(id: string) {
  await requireAdmin();
  try {
    await prisma.referralCode.delete({ where: { id } });
    revalidatePath("/admin/referral-codes");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete referral code" };
  }
}
