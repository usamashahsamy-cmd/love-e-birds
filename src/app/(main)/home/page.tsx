import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchDiscoverProfiles } from "@/lib/discover";
import HomeClient from "@/components/home/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [banners, categories, stickyNote, featuredUsers, { data, nextCursor, hasMore }] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true, slug: { not: "verification-vip" } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, subtitle: true, imageUrl: true, linkUrl: true },
    }),
    prisma.locationCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, content: true },
    }),
    prisma.user.findMany({
      where: { isFeatured: true, status: "ACTIVE" },
      select: { id: true, username: true, displayName: true, avatar: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    fetchDiscoverProfiles(session.user.id, { limit: 8 }),
  ]);

  return (
    <HomeClient
      banners={banners}
      categories={categories}
      initialProfiles={data}
      initialNextCursor={nextCursor}
      initialHasMore={hasMore}
      initialCategory="all"
      initialStickyNote={stickyNote}
      initialFeaturedUsers={featuredUsers}
    />
  );
}