import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ success: true, data: [], nextCursor: null, hasMore: false });
  }

  const limit = 10;
  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } },
          {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        profile: {
          select: {
            location: true,
            isOnline: true,
            likesCount: true,
            isVerified: true,
            points: true,
          },
        },
      },
      orderBy: [{ displayName: "asc" }],
      take: limit,
    });

    const data = users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      location: u.profile?.location ?? null,
      isOnline: u.profile?.isOnline ?? false,
      likesCount: u.profile?.likesCount ?? 0,
      isVerified: u.profile?.isVerified ?? false,
      points: u.profile?.points ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data,
      nextCursor: null,
      hasMore: false,
    });
  } catch (e) {
    console.error("Search error:", e);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}