"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificationSchema, type VerificationInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

export async function submitVerification(data: VerificationInput) {
  const userId = await requireUser();
  const parsed = verificationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const existing = await prisma.verification.findUnique({ where: { userId } });
  if (existing?.status === "PENDING") {
    return { success: false, error: "Verification request is already pending review" };
  }
  if (existing?.status === "APPROVED") {
    return { success: false, error: "You are already verified" };
  }

  try {
    if (existing) {
      await prisma.verification.update({
        where: { id: existing.id },
        data: {
          fullName: parsed.data.fullName,
          idType: parsed.data.idType,
          documentUrl: parsed.data.documentUrl,
          selfieUrl: parsed.data.selfieUrl || null,
          status: "PENDING",
          notes: null,
          reviewedAt: null,
        },
      });
    } else {
      await prisma.verification.create({
        data: {
          userId,
          fullName: parsed.data.fullName,
          idType: parsed.data.idType,
          documentUrl: parsed.data.documentUrl,
          selfieUrl: parsed.data.selfieUrl || null,
          status: "PENDING",
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId,
        type: "VERIFICATION",
        title: "Verification submitted",
        content: "Our team will review your documents shortly.",
      },
    });

    revalidatePath("/mine/verification");
    revalidatePath("/mine");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to submit verification request" };
  }
}