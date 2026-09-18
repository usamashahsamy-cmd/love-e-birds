import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActivityByIdOrSlug } from "@/lib/activities";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const activity = await getActivityByIdOrSlug(id);
  if (!activity) {
    return NextResponse.json({ success: false, error: "Activity not found" }, { status: 404 });
  }

  const links = await prisma.activityProduct.findMany({
    where: { activityId: activity.id },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    include: { product: { include: { category: true } } },
  });

  return NextResponse.json({
    success: true,
    products: links.map((l) => ({
      id: l.product.id,
      name: l.product.name,
      description: l.product.description,
      imageUrl: l.product.imageUrl,
      ticketCost: l.product.ticketCost,
      active: l.product.active,
      category: l.product.category ? { id: l.product.category.id, name: l.product.category.name, slug: l.product.category.slug } : null,
      displayOrder: l.displayOrder,
      isFeatured: l.isFeatured,
    })),
  });
}
