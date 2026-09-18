"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bannerSchema, type BannerInput } from "@/lib/validations";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function saveBanner(input: BannerInput & { id?: string }) {
  const admin = await requireAdmin();
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.banner.update({ where: { id }, data });
    } else {
      await prisma.banner.create({ data });
    }

    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: id ? "UPDATE_BANNER" : "CREATE_BANNER",
        entityType: "Banner",
        entityId: id,
        details: data,
      },
    });

    revalidatePath("/admin/banners");
    revalidatePath("/home");
    revalidatePath("/mine/verification");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to save banner" };
  }
}

export async function toggleBanner(id: string, isActive: boolean) {
  const admin = await requireAdmin();
  try {
    await prisma.banner.update({ where: { id }, data: { isActive } });
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: isActive ? "ACTIVATE_BANNER" : "DEACTIVATE_BANNER",
        entityType: "Banner",
        entityId: id,
      },
    });
    revalidatePath("/admin/banners");
    revalidatePath("/home");
    revalidatePath("/mine/verification");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update banner" };
  }
}

export async function deleteBanner(id: string) {
  const admin = await requireAdmin();
  try {
    await prisma.banner.delete({ where: { id } });
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: "DELETE_BANNER",
        entityType: "Banner",
        entityId: id,
      },
    });
    revalidatePath("/admin/banners");
    revalidatePath("/home");
    revalidatePath("/mine/verification");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete banner" };
  }
}
