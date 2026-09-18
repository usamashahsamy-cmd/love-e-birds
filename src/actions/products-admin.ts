"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).default(""),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  ticketCost: z.number().int().min(1).max(100000),
  categoryId: z.string().nullable().optional(),
  active: z.boolean(),
});

export async function saveProduct(id: string | null, input: unknown) {
  const admin = await requireAdmin();
  const result = productSchema.safeParse(input);
  if (!result.success) return { success: false, error: result.error.issues[0].message };
  if (id !== null && (typeof id !== "string" || !id.trim())) {
    return { success: false, error: "Invalid product" };
  }
  const data = {
    name: result.data.name,
    description: result.data.description,
    imageUrl: result.data.imageUrl || null,
    ticketCost: result.data.ticketCost,
    categoryId: result.data.categoryId || null,
    active: result.data.active,
  };
  try {
    await prisma.$transaction(async (tx) => {
      const product = id
        ? await tx.product.update({ where: { id }, data })
        : await tx.product.create({ data });
      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: id ? "UPDATE_PRODUCT" : "CREATE_PRODUCT",
          entityType: "Product",
          entityId: product.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "A product with this name already exists" };
    }
    return { success: false, error: "Unable to save product. Please try again." };
  }
  revalidatePath("/admin/products");
  return { success: true };
}

export async function saveCategory(input: { name: string; slug: string }) {
  const admin = await requireAdmin();
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { success: false, error: "Enter a name and valid slug" };
  }
  try {
    await prisma.$transaction(async (tx) => {
      const cat = await tx.productCategory.upsert({
        where: { slug },
        update: { name },
        create: { name, slug },
      });
      await tx.adminAction.create({
        data: { adminId: admin.id, action: "SAVE_CATEGORY", entityType: "ProductCategory", entityId: cat.id },
      });
    });
  } catch {
    return { success: false, error: "Unable to save category" };
  }
  revalidatePath("/admin/products");
  return { success: true };
}

export async function addProductToActivity(input: {
  activityId: string;
  productId: string;
  displayOrder?: number;
  isFeatured?: boolean;
}) {
  const admin = await requireAdmin();
  try {
    await prisma.activityProduct.upsert({
      where: { activityId_productId: { activityId: input.activityId, productId: input.productId } },
      update: { displayOrder: input.displayOrder ?? 0, isFeatured: input.isFeatured ?? false },
      create: {
        activityId: input.activityId,
        productId: input.productId,
        displayOrder: input.displayOrder ?? 0,
        isFeatured: input.isFeatured ?? false,
      },
    });
    await prisma.adminAction.create({
      data: { adminId: admin.id, action: "ADD_PRODUCT_TO_ACTIVITY", entityType: "ActivityProduct", entityId: input.activityId },
    });
  } catch {
    return { success: false, error: "Unable to add product to activity" };
  }
  revalidatePath("/admin/activities");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function removeProductFromActivity(activityProductId: string) {
  const admin = await requireAdmin();
  try {
    await prisma.activityProduct.delete({ where: { id: activityProductId } });
    await prisma.adminAction.create({
      data: { adminId: admin.id, action: "REMOVE_PRODUCT_FROM_ACTIVITY", entityType: "ActivityProduct", entityId: activityProductId },
    });
  } catch {
    return { success: false, error: "Unable to remove product" };
  }
  revalidatePath("/admin/activities");
  revalidatePath("/admin/products");
  return { success: true };
}
