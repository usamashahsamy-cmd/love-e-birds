import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GiftStore from "@/components/gifts/GiftStore";
import { Gift } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GiftStorePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const { to } = await searchParams;

  const [gifts, wallet, matches, following, profile] = await Promise.all([
    prisma.gift.findMany({
      where: { isActive: true },
      orderBy: { value: "asc" },
    }),
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
    prisma.match.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { target: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.follow.findMany({
      where: { followerId: session.user.id },
      include: { following: { include: { profile: true } } },
    }),
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
  ]);

  const myPoints = profile?.points ?? 0;
  const balance = wallet?.balance ? Number(wallet.balance.toString()) : 0;

  const recipientMap = new Map<string, { id: string; username: string; displayName: string; avatar: string | null }>();
  for (const m of matches) {
    recipientMap.set(m.target.id, {
      id: m.target.id,
      username: m.target.username,
      displayName: m.target.displayName,
      avatar: m.target.avatar,
    });
  }
  for (const f of following) {
    recipientMap.set(f.following.id, {
      id: f.following.id,
      username: f.following.username,
      displayName: f.following.displayName,
      avatar: f.following.avatar,
    });
  }

  const prefillRecipient = to
    ? [...recipientMap.values()].find((r) => r.username === to) ?? null
    : null;

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Gift size={20} className="text-accent" />
        <h1 className="text-lg font-bold text-foreground">Gift Store</h1>
      </div>
      <p className="px-4 text-xs text-muted-foreground mt-1">
        Send a gift from your wallet — the recipient earns points instantly.
      </p>
      <GiftStore
        gifts={gifts.map((g) => ({
          id: g.id,
          name: g.name,
          type: g.type,
          imageUrl: g.imageUrl,
          value: Number(g.value.toString()),
        }))}
        balance={balance}
        myPoints={myPoints}
        recipients={[...recipientMap.values()]}
        prefillRecipient={prefillRecipient}
      />
    </div>
  );
}