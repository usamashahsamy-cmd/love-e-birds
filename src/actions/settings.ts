"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileEditSchema, changePasswordSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

export async function updateProfile(input: {
  displayName: string;
  bio?: string;
  location?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
}) {
  const userId = await requireUser();
  const parsed = profileEditSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const dob = parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null;
  const age =
    dob && !Number.isNaN(dob.getTime())
      ? Math.max(18, Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)))
      : null;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: parsed.data.displayName,
        profile: {
          update: {
            bio: parsed.data.bio ?? "",
            location: parsed.data.location ?? "",
            gender: parsed.data.gender ?? "OTHER",
            dateOfBirth: dob,
            age,
          },
        },
      },
    });
    revalidatePath("/mine/essential-information");
    revalidatePath("/mine");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update profile" };
  }
}

export async function clearWatchHistory() {
  const userId = await requireUser();
  await prisma.watchHistory.deleteMany({ where: { viewerId: userId } });
  revalidatePath("/mine/watch-history");
  return { success: true };
}

export async function deactivateAccount() {
  const userId = await requireUser();
  await prisma.user.update({
    where: { id: userId },
    data: { status: "DEACTIVATED" },
  });
  return { success: true };
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const userId = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "User not found" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { success: false, error: "Current password is incorrect" };

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  try {
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    await prisma.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        title: "Password changed",
        content: "Your login password was updated successfully.",
      },
    });
    revalidatePath("/mine/login-password");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to change password" };
  }
}