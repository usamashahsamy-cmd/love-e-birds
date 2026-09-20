import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchMyMatches } from "@/lib/matches";
import { mapUserToDiscover, type DiscoverProfile } from "@/lib/discover";
import MatchList from "@/components/match/MatchList";
import ProfileGrid from "@/components/discovery/ProfileGrid";
import { Heart, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MatchPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const myId = session.user.id;

  const [matches, featuredUsers] = await Promise.all([
    fetchMyMatches(myId),
    prisma.user.findMany({
      where: { isFeatured: true, status: "ACTIVE", id: { not: myId } },
      include: { profile: { include: { interests: { include: { interest: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const liked = await prisma.like.findMany({
    where: { senderId: myId, receiverId: { in: featuredUsers.map((u) => u.id) } },
    select: { receiverId: true },
  });
  const likedSet = new Set(liked.map((l) => l.receiverId));

  const featured: DiscoverProfile[] = await Promise.all(
    featuredUsers.map(async (u) => {
      const item = await mapUserToDiscover(u);
      return { ...item, isLiked: likedSet.has(u.id) };
    })
  );

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-lg font-bold text-foreground">Match</h1>
        <span className="inline-flex items-center gap-1 text-[11px] bg-accent/10 text-accent-dark font-semibold rounded-full px-2.5 py-1">
          <Heart size={12} className="fill-current" /> {matches.length} matches
        </span>
      </div>

      {featured.length > 0 && (
        <section className="mt-3">
          <div className="flex items-center gap-2 px-4">
            <Sparkles size={15} className="text-primary" />
            <h2 className="text-sm font-bold">Curated Profiles</h2>
          </div>
          <ProfileGrid
            profiles={featured}
            showSkeleton={false}
            emptyTitle="No profiles yet"
            emptyDescription="The admin hasn't selected any profiles to show right now."
          />
        </section>
      )}

      <div className="px-4 mt-4">
        <h2 className="text-sm font-bold mb-3">My Matches</h2>
      </div>
      <MatchList matches={matches} />
    </div>
  );
}