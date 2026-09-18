import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchDiscoverProfiles } from "@/lib/discover";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category") ?? "all";
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 8);

  try {
    const result = await fetchDiscoverProfiles(session.user.id, {
      categorySlug,
      cursor,
      limit,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error("Discover error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to load profiles" },
      { status: 500 }
    );
  }
}