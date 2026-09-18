import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeActivity } from "@/lib/activities";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const activities = await prisma.activity.findMany({
    where: { active: true },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({ success: true, activities: activities.map(serializeActivity) });
}
