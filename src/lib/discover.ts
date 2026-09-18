import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface DiscoverProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  location: string | null;
  points: number;
  likesCount: number;
  isVerified: boolean;
  isOnline: boolean;
  isLiked: boolean;
  interests: { id: string; name: string }[];
}

type PrismaUser = Prisma.UserGetPayload<{
  include: {
    profile: {
      include: {
        interests: { include: { interest: true } };
      };
    };
  };
}>;

export async function mapUserToDiscover(user: PrismaUser): Promise<DiscoverProfile> {
  const profile = user.profile;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: profile?.bio ?? "",
    location: profile?.location ?? null,
    points: profile?.points ?? 0,
    likesCount: profile?.likesCount ?? 0,
    isVerified: profile?.isVerified ?? false,
    isOnline: profile?.isOnline ?? false,
    isLiked: false,
    interests: profile?.interests.map((ui) => ({
      id: ui.interestId,
      name: ui.interest.name,
    })) ?? [],
  };
}

export interface DiscoverQuery {
  categorySlug?: string;
  cursor?: string;
  limit?: number;
  ageMin?: number;
  ageMax?: number;
}

export async function fetchDiscoverProfiles(myId: string, query: DiscoverQuery = {}) {
  const limit = Math.min(query.limit ?? 8, 24);

  const blocked = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: myId }, { blockedId: myId }],
    },
    select: { blockerId: true, blockedId: true },
  });

  const excludeIds = new Set(blocked.map((b) => b.blockerId).concat(blocked.map((b) => b.blockedId)));
  excludeIds.add(myId);

  const locationCategory = query.categorySlug && query.categorySlug !== "all"
    ? await prisma.locationCategory.findUnique({ where: { slug: query.categorySlug } })
    : null;

  const profileAnd: Prisma.ProfileWhereInput[] = [];
  if (locationCategory) profileAnd.push({ locationCategoryId: locationCategory.id });
  if (query.ageMin || query.ageMax) profileAnd.push({ age: { gte: query.ageMin, lte: query.ageMax } });

  const where: Prisma.UserWhereInput = {
    AND: [
      { id: { notIn: Array.from(excludeIds) } },
      profileAnd.length > 0 ? { profile: { AND: profileAnd } } : {},
    ],
  };

  const users = await prisma.user.findMany({
    where,
    include: {
      profile: { include: { interests: { include: { interest: true } } } },
    },
    orderBy: [
      { profile: { likesCount: "desc" } },
      { createdAt: "desc" },
    ],
    take: limit + 1,
    cursor: query.cursor ? { id: query.cursor } : undefined,
    skip: query.cursor ? 1 : 0,
  });

  const hasMore = users.length > limit;
  const page = users.slice(0, limit);

  const liked = await prisma.like.findMany({
    where: { senderId: myId, receiverId: { in: page.map((u) => u.id) } },
    select: { receiverId: true },
  });
  const likedSet = new Set(liked.map((l) => l.receiverId));

  const data = await Promise.all(
    page.map(async (u) => {
      const item = await mapUserToDiscover(u);
      return { ...item, isLiked: likedSet.has(u.id) };
    })
  );

  return {
    data,
    nextCursor: hasMore ? page[page.length - 1].id : null,
    hasMore,
  };
}