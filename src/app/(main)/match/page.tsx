import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { fetchMyMatches } from "@/lib/matches";
import MatchList from "@/components/match/MatchList";
import { Heart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MatchPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const matches = await fetchMyMatches(session.user.id);

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-lg font-bold text-foreground">Match</h1>
        <span className="inline-flex items-center gap-1 text-[11px] bg-accent/10 text-accent-dark font-semibold rounded-full px-2.5 py-1">
          <Heart size={12} className="fill-current" /> {matches.length} matches
        </span>
      </div>
      <MatchList matches={matches} />
    </div>
  );
}