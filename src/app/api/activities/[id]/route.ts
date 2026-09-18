import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActivityByIdOrSlug, serializeActivity } from "@/lib/activities";

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

  return NextResponse.json({ success: true, activity: serializeActivity(activity) });
}
