import "server-only";

import { prisma } from "@/lib/prisma";

export interface MatchItem {
  matchId: string;
  matchedAt: Date;
  isNewThisWeek: boolean;
  conversationId: string | null;
  lastMessageAt: Date | null;
  target: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    location: string | null;
    isOnline: boolean;
    isVerified: boolean;
    likesCount: number;
  };
}

export async function fetchMyMatches(
  myId: string,
  options: { onlineOnly?: boolean } = {}
): Promise<MatchItem[]> {
  const blocked = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: myId }, { blockedId: myId }],
    },
    select: { blockerId: true, blockedId: true },
  });
  const excludeIds = new Set(
    blocked.map((b) => b.blockerId).concat(blocked.map((b) => b.blockedId))
  );

  const matches = await prisma.match.findMany({
    where: { userId: myId, status: "ACTIVE" },
    include: {
      target: { include: { profile: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const otherIds = matches.map((m) => m.targetId);

  const conversations = await prisma.conversation.findMany({
    where: {
      type: "DIRECT",
      members: { some: { userId: myId } },
    },
    include: {
      members: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const convByOtherId = new Map<string, { id: string; lastMessageAt: Date | null }>();
  for (const c of conversations) {
    const other = c.members.find((member) => member.userId !== myId);
    if (other && otherIds.includes(other.userId)) {
      convByOtherId.set(other.userId, {
        id: c.id,
        lastMessageAt: c.messages[0]?.createdAt ?? null,
      });
    }
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return matches
    .filter((m) => {
      if (excludeIds.has(m.targetId)) return false;
      if (options.onlineOnly && !m.target.profile?.isOnline) return false;
      return true;
    })
    .map((m): MatchItem => {
      const t = m.target;
      const conv = convByOtherId.get(t.id);
      return {
        matchId: m.id,
        matchedAt: m.createdAt,
        isNewThisWeek: m.createdAt >= weekAgo,
        conversationId: conv?.id ?? null,
        lastMessageAt: conv?.lastMessageAt ?? null,
        target: {
          id: t.id,
          username: t.username,
          displayName: t.displayName,
          avatar: t.avatar,
          location: t.profile?.location ?? null,
          isOnline: t.profile?.isOnline ?? false,
          isVerified: t.profile?.isVerified ?? false,
          likesCount: t.profile?.likesCount ?? 0,
        },
      };
    });
}