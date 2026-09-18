"use server";

import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/storage";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function uploadLogo(formData: FormData) {
  const admin = await requireAdmin();
  const file = formData.get("logo") as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: "Please select a PNG image" };
  }

  if (file.type !== "image/png") {
    return { success: false, error: "Only PNG images are allowed" };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "Image must be under 2MB" };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `logo-${Date.now()}.png`;
    const logoUrl = await uploadToStorage(buffer, "image/png", `uploads/${fileName}`);

    // Remove previous local logo files only when using local fallback
    if (logoUrl.startsWith("/uploads/")) {
      try {
        const files = await fs.readdir(UPLOAD_DIR);
        for (const f of files) {
          if (f.startsWith("logo-") && f.endsWith(".png")) {
            await fs.unlink(path.join(UPLOAD_DIR, f));
          }
        }
      } catch {
        // ignore
      }
    }

    await prisma.siteSetting.upsert({
      where: { key: "app_logo" },
      update: { value: logoUrl },
      create: { key: "app_logo", value: logoUrl },
    });

    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_APP_LOGO",
        entityType: "SiteSetting",
        details: { logoUrl },
      },
    });

    revalidatePath("/admin/branding");
    revalidatePath("/home");
    revalidatePath("/login");
    revalidatePath("/register");
    return { success: true, logoUrl };
  } catch {
    return { success: false, error: "Failed to upload logo" };
  }
}

export async function resetLogo() {
  const admin = await requireAdmin();
  try {
    await prisma.siteSetting.deleteMany({ where: { key: "app_logo" } });

    if (!process.env.R2_ENDPOINT) {
      try {
        const files = await fs.readdir(UPLOAD_DIR);
        for (const f of files) {
          if (f.startsWith("logo-") && f.endsWith(".png")) {
            await fs.unlink(path.join(UPLOAD_DIR, f));
          }
        }
      } catch {
        // ignore
      }
    }

    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: "RESET_APP_LOGO",
        entityType: "SiteSetting",
      },
    });
    revalidatePath("/admin/branding");
    revalidatePath("/home");
    revalidatePath("/login");
    revalidatePath("/register");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to reset logo" };
  }
}
