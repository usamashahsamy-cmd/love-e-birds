import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActivityByIdOrSlug } from "@/lib/activities";
import { participate } from "@/actions/activities";

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

  if (!body.productId) {
    return NextResponse.json({ success: false, error: "Product is required" }, { status: 400 });
  }

  const result = await participate({
    activityId: activity.id,
    productId: body.productId,
    quantity: Math.floor(Number(body.quantity ?? 1)),
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
