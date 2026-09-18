import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActivityByIdOrSlug } from "@/lib/activities";

export async function PATCH(
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

  let body: { quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const qty = Math.floor(Number(body.quantity));
  if (!Number.isInteger(qty) || qty < 1) {
    return NextResponse.json({ success: false, error: "Invalid quantity" }, { status: 400 });
  }
  if (qty > activity.maxQuantity) {
    return NextResponse.json(
      { success: false, error: `Maximum quantity is ${activity.maxQuantity}` },
      { status: 400 }
    );
  }

  const existing = await prisma.productSelection.findUnique({
    where: { userId_activityId: { userId: session.user.id, activityId: activity.id } },
    include: { product: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "No selection to update" }, { status: 400 });
  }

  const selection = await prisma.productSelection.update({
    where: { id: existing.id },
    data: { quantity: qty },
  });

  return NextResponse.json({
    success: true,
    selection: {
      productId: selection.productId,
      quantity: selection.quantity,
      total: existing.product.ticketCost * selection.quantity,
      ticket: existing.product.ticketCost * selection.quantity,
    },
  });
}
