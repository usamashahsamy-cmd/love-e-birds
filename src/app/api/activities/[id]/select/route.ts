import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActivityByIdOrSlug } from "@/lib/activities";

export async function POST(
  request: Request,
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

  let body: { productId?: string; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const productId = body.productId;
  const qty = Math.floor(Number(body.quantity ?? 1));
  if (!productId || !Number.isInteger(qty) || qty < 1) {
    return NextResponse.json({ success: false, error: "Invalid product or quantity" }, { status: 400 });
  }
  if (qty > activity.maxQuantity) {
    return NextResponse.json(
      { success: false, error: `Maximum quantity is ${activity.maxQuantity}` },
      { status: 400 }
    );
  }

  const link = await prisma.activityProduct.findUnique({
    where: { activityId_productId: { activityId: activity.id, productId } },
    include: { product: true },
  });
  if (!link || !link.product.active) {
    return NextResponse.json({ success: false, error: "Product not available" }, { status: 400 });
  }

  const selection = await prisma.productSelection.upsert({
    where: { userId_activityId: { userId: session.user.id, activityId: activity.id } },
    update: { productId, quantity: qty },
    create: { userId: session.user.id, activityId: activity.id, productId, quantity: qty },
  });

  return NextResponse.json({
    success: true,
    selection: {
      productId: selection.productId,
      quantity: selection.quantity,
      total: link.product.ticketCost * selection.quantity,
      ticket: link.product.ticketCost * selection.quantity,
    },
  });
}
