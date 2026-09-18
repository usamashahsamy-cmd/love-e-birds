"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") redirect("/login");
  return { id: user.id };
}

function toNumber(value: unknown): number {
  if (value instanceof Object && "toString" in (value as object)) {
    return Number((value as { toString(): string }).toString());
  }
  return Number(value);
}

async function logAdminAction(
  tx: Prisma.TransactionClient,
  adminId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, string | number | boolean | null> | null
) {
  await tx.adminAction.create({
    data: { adminId, action, entityType, entityId, details: (details ?? undefined) as Prisma.InputJsonValue },
  });
}

/* ------------------------------ Reports ------------------------------ */

export async function reviewReport(
  reportId: string,
  input: { action: "REVIEWED" | "RESOLVED" | "DISMISSED"; note?: string; banTarget?: boolean }
) {
  const admin = await requireAdmin();
  const report = await prisma.report.findUnique({ where: { id: reportId }, select: { targetId: true } });
  if (!report) return { success: false, error: "Report not found" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.report.update({
        where: { id: reportId },
        data: { status: input.action, adminNote: input.note || null, reviewedById: admin.id, reviewedAt: new Date() },
      });
      if (input.banTarget) {
        await tx.user.update({ where: { id: report.targetId }, data: { status: "BANNED" } });
      }
      await logAdminAction(tx, admin.id, "REVIEW_REPORT", "Report", reportId, {
        action: input.action,
        banTarget: input.banTarget ?? false,
      });
    });
    revalidatePath("/admin/reports");
    return { success: true };
  } catch {
    return { success: false, error: "Action failed" };
  }
}

/* --------------------------- Verifications --------------------------- */

export async function reviewVerification(
  verificationId: string,
  input: { action: "APPROVED" | "REJECTED"; notes?: string }
) {
  const admin = await requireAdmin();
  const verification = await prisma.verification.findUnique({
    where: { id: verificationId },
    select: { userId: true, status: true },
  });
  if (!verification || verification.status !== "PENDING") {
    return { success: false, error: "Verification not pending" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.verification.update({
        where: { id: verificationId },
        data: {
          status: input.action,
          notes: input.notes || null,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
      if (input.action === "APPROVED") {
        await tx.profile.update({
          where: { userId: verification.userId },
          data: { isVerified: true },
        });
      }
      await tx.notification.create({
        data: {
          userId: verification.userId,
          type: "VERIFICATION",
          title:
            input.action === "APPROVED" ? "You are now verified! 🎉" : "Verification update",
          content:
            input.action === "APPROVED"
              ? "Your identity was approved. The verified badge now shows on your profile."
              : `Your verification was rejected. ${input.notes ?? "Please resubmit with clear documents."}`,
          link: "/mine/verification",
        },
      });
      await logAdminAction(tx, admin.id, "REVIEW_VERIFICATION", "Verification", verificationId, {
        action: input.action,
      });
    });
    revalidatePath("/admin/verifications");
    revalidatePath("/mine/verification");
    return { success: true };
  } catch {
    return { success: false, error: "Action failed" };
  }
}

/* --------------------------- Withdrawals ------------------------------ */

export async function processWithdrawal(
  withdrawalId: string,
  input: { action: "PROCESSING" | "APPROVED" | "REJECTED"; note?: string }
) {
  const admin = await requireAdmin();
  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal) return { success: false, error: "Withdrawal not found" };
  if (withdrawal.status !== "PENDING" && withdrawal.status !== "PROCESSING") {
    return { success: false, error: "Withdrawal already processed" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (input.action === "REJECTED") {
        const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId: withdrawal.userId } });
        const updated = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            frozenBalance: { decrement: withdrawal.amount },
            balance: { increment: withdrawal.amount },
          },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "REFUND",
            amount: withdrawal.amount,
            direction: "CREDIT",
            description: "Withdrawal rejected — amount refunded",
            balanceAfter: toNumber(updated.balance),
          },
        });
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: "REJECTED", accountNote: input.note || null, processedAt: new Date() },
        });
        await tx.notification.create({
          data: {
            userId: withdrawal.userId,
            type: "WALLET",
            title: "Withdrawal rejected",
            content: `₹${toNumber(withdrawal.amount)} was returned to your balance. ${
              input.note ?? ""
            }`,
            link: "/mine/withdraw-details",
          },
        });
      } else if (input.action === "APPROVED") {
        await tx.wallet.update({
          where: { userId: withdrawal.userId },
          data: { frozenBalance: { decrement: withdrawal.amount } },
        });
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: "COMPLETED", accountNote: input.note || null, processedAt: new Date() },
        });
        await tx.notification.create({
          data: {
            userId: withdrawal.userId,
            type: "WALLET",
            title: "Withdrawal completed",
            content: `₹${toNumber(withdrawal.amount)} has been sent to your account.`,
            link: "/mine/withdraw-details",
          },
        });
      } else {
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: "PROCESSING" },
        });
      }
      await logAdminAction(tx, admin.id, "PROCESS_WITHDRAWAL", "Withdrawal", withdrawalId, {
        action: input.action,
      });
    });
    revalidatePath("/admin/withdrawals");
    revalidatePath("/mine/withdraw-details");
    return { success: true };
  } catch {
    return { success: false, error: "Action failed" };
  }
}

/* ------------------------------- Users -------------------------------- */

export async function setUserStatus(targetUserId: string, status: "ACTIVE" | "SUSPENDED" | "BANNED") {
  const admin = await requireAdmin();
  if (targetUserId === admin.id) return { success: false, error: "You can't change your own status" };
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: targetUserId }, data: { status } });
      await logAdminAction(tx, admin.id, "SET_USER_STATUS", "User", targetUserId, { status });
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Action failed" };
  }
}

export async function setUserCreditScore(targetUserId: string, score: number) {
  const admin = await requireAdmin();
  const clamped = Math.max(0, Math.min(1000, Math.floor(Number(score) || 0)));
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: targetUserId }, data: { creditScore: clamped } });
      await logAdminAction(tx, admin.id, "ADJUST_CREDIT_SCORE", "User", targetUserId, { score: clamped });
    });
    revalidatePath("/admin/users");
    revalidatePath("/mine");
    return { success: true };
  } catch {
    return { success: false, error: "Action failed" };
  }
}

/* ------------------------------- Gifts -------------------------------- */

export async function createGift(input: {
  name: string;
  type: "EMOJI" | "ANIMATED" | "VIRTUAL_ITEM";
  value: number;
  imageUrl?: string;
}) {
  const admin = await requireAdmin();
  if (!input.name.trim() || !(input.value > 0)) {
    return { success: false, error: "Enter a name and a valid value" };
  }
  try {
    const gift = await prisma.gift.create({
      data: { name: input.name.trim(), type: input.type, value: input.value, imageUrl: input.imageUrl || null },
    });
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: "CREATE_GIFT",
        entityType: "Gift",
        entityId: gift.id,
        details: { name: gift.name, value: input.value },
      },
    });
    revalidatePath("/admin/gifts");
    revalidatePath("/gifts");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to create gift" };
  }
}

export async function toggleGift(giftId: string, isActive: boolean) {
  const admin = await requireAdmin();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.gift.update({ where: { id: giftId }, data: { isActive } });
      await logAdminAction(tx, admin.id, "TOGGLE_GIFT", "Gift", giftId, { isActive });
    });
    revalidatePath("/admin/gifts");
    revalidatePath("/gifts");
    return { success: true };
  } catch {
    return { success: false, error: "Action failed" };
  }
}

/* --------------------------- Announcements ---------------------------- */

export async function createAnnouncement(input: {
  title: string;
  content: string;
  target: "ALL" | "USER" | "ADMIN";
}) {
  const admin = await requireAdmin();
  if (!input.title.trim() || !input.content.trim()) {
    return { success: false, error: "Title and content are required" };
  }
  try {
    const announcement = await prisma.announcement.create({
      data: { title: input.title.trim(), content: input.content.trim(), target: input.target },
    });
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: "CREATE_ANNOUNCEMENT",
        entityType: "Announcement",
        entityId: announcement.id,
      },
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/mine/announcements");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to create announcement" };
  }
}

export async function toggleAnnouncement(announcementId: string, isActive: boolean) {
  const admin = await requireAdmin();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.announcement.update({ where: { id: announcementId }, data: { isActive } });
      await logAdminAction(tx, admin.id, "TOGGLE_ANNOUNCEMENT", "Announcement", announcementId, {
        isActive,
      });
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/mine/announcements");
    return { success: true };
  } catch {
    return { success: false, error: "Action failed" };
  }
}

export async function updateUserAvatar(userId: string, avatarUrl: string) {
  const admin = await requireAdmin();
  if (!avatarUrl.trim() || !avatarUrl.startsWith("http")) {
    return { success: false, error: "Valid image URL is required" };
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { avatar: avatarUrl.trim() } });
      await logAdminAction(tx, admin.id, "UPDATE_USER_AVATAR", "User", userId, {
        avatarUrl: avatarUrl.trim(),
      });
    });
    revalidatePath("/admin/users");
    revalidatePath(`/profile/${userId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update avatar" };
  }
}

export async function updateUserDetails(
  userId: string,
  data: {
    displayName?: string;
    username?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    status?: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
    creditScore?: number;
    bio?: string;
    location?: string;
  }
) {
  const admin = await requireAdmin();

  if (data.username && !/^[a-zA-Z0-9_]+$/.test(data.username)) {
    return { success: false, error: "Username can only contain letters, numbers and underscores" };
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { success: false, error: "Invalid email address" };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!existing) return { success: false, error: "User not found" };

    if (data.username && data.username !== existing.username) {
      const taken = await prisma.user.findUnique({ where: { username: data.username } });
      if (taken) return { success: false, error: "Username already taken" };
    }
    if (data.email && data.email !== existing.email) {
      const taken = await prisma.user.findUnique({ where: { email: data.email } });
      if (taken) return { success: false, error: "Email already taken" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          displayName: data.displayName,
          username: data.username,
          email: data.email,
          phone: data.phone,
          countryCode: data.countryCode,
          status: data.status,
          creditScore: data.creditScore,
        },
      });

      if (existing.profile && (data.bio !== undefined || data.location !== undefined)) {
        await tx.profile.update({
          where: { userId },
          data: {
            bio: data.bio,
            location: data.location,
          },
        });
      }

      await logAdminAction(tx, admin.id, "UPDATE_USER_DETAILS", "User", userId, {
        displayName: data.displayName ?? existing.displayName,
        username: data.username ?? existing.username,
        email: data.email ?? existing.email,
      });
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath(`/profile/${data.username ?? existing.username}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update user" };
  }
}

export async function setUserFeatured(userId: string, featured: boolean) {
  const admin = await requireAdmin();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { isFeatured: featured } });
      await logAdminAction(tx, admin.id, featured ? "FEATURE_USER" : "UNFEATURE_USER", "User", userId, {
        featured,
      });
    });
    revalidatePath("/admin/users");
    revalidatePath("/admin/featured-users");
    revalidatePath("/home");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update featured status" };
  }
}