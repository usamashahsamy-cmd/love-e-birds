"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureDefaultReferralCode } from "@/lib/referral";
import { registerSchema, type RegisterInput } from "@/lib/validations";

export async function registerUser(data: RegisterInput) {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { username, email, displayName, countryCode, phone, password, referralCode } = parsed.data;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    const field = existingUser.email === email ? "email" : "username";
    return { success: false, error: `This ${field} is already taken` };
  }

  let codeId: string | undefined;

  // Validate optional referral code
  if (referralCode && referralCode.trim()) {
    await ensureDefaultReferralCode();
    const code = await prisma.referralCode.findUnique({
      where: { code: referralCode.trim().toUpperCase() },
    });

    if (!code) {
      return { success: false, error: "Invalid referral code" };
    }
    if (!code.active) {
      return { success: false, error: "This referral code is no longer active" };
    }
    if (code.usedCount >= code.maxUses) {
      return { success: false, error: "This referral code has already been used" };
    }
    codeId = code.id;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    if (codeId) {
      await tx.referralCode.update({
        where: { id: codeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    return tx.user.create({
      data: {
        email,
        username,
        displayName,
        countryCode,
        phone,
        passwordHash,
        referralCodeId: codeId,
        profile: {
          create: {},
        },
        wallet: {
          create: {},
        },
      },
    });
  });

  return { success: true, userId: user.id };
}