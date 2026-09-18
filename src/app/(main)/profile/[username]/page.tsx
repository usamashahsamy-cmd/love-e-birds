import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ImageGallery from "@/components/ui/ImageGallery";
import ProfileActions from "@/components/profile/ProfileActions";
import { ArrowLeft, MapPin, Zap, Heart, BadgeCheck, UserCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      profile: {
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
          interests: { include: { interest: true } },
        },
      },
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <UserCircle2 size={40} className="text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">Profile not found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-5">
          This profile doesn&apos;t exist or has been removed.
        </p>
        <Link href="/home">
          <Button variant="secondary">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const myId = session.user.id;
  const isOwn = user.id === myId;
  const profile = user.profile;

  const [like, follow] = await Promise.all([
    prisma.like.findUnique({
      where: { senderId_receiverId: { senderId: myId, receiverId: user.id } },
    }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: myId, followingId: user.id } },
    }),
  ]);

  const blockedByMe = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: myId, blockedId: user.id } },
  });

  if (!isOwn && profile) {
    await prisma.watchHistory.upsert({
      where: { viewerId_profileId: { viewerId: myId, profileId: profile.id } },
      update: { viewedAt: new Date() },
      create: { viewerId: myId, profileId: profile.id },
    });
  }

  const galleryImages = [
    ...(profile?.coverImage
      ? [{ url: profile.coverImage, caption: "Cover" }]
      : []),
    ...(profile?.photos ?? []).map((p) => ({ url: p.url, caption: p.caption })),
  ].slice(0, 6);

  const fallbackGallery =
    galleryImages.length > 0
      ? galleryImages
      : [
          {
            url: `https://placehold.co/600x750/7c3aed/ffffff?text=${encodeURIComponent(user.displayName.charAt(0))}`,
            caption: null,
          },
        ];

  const isLiked = !!like;
  const isFollowing = !!follow;

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-card-border">
        <div className="flex items-center gap-3 h-12 px-3">
          <Link href="/home" aria-label="Back">
            <ArrowLeft size={22} className="text-foreground" />
          </Link>
          <span className="font-semibold text-sm truncate">{user.displayName}</span>
          {profile?.isOnline && (
            <span className="flex items-center gap-1 text-[10px] text-success ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> Online
            </span>
          )}
        </div>
      </div>

      <ImageGallery images={fallbackGallery} />

      <div className="px-4 -mt-10 relative z-10">
        <div className="flex items-end justify-between">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.displayName}
              width={72}
              height={72}
              className="w-[72px] h-[72px] rounded-full border-4 border-white object-cover shadow-md"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full border-4 border-white bg-muted flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold text-muted-foreground">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {profile?.isVerified && (
            <span className="mb-1 inline-flex items-center gap-1 text-[11px] bg-accent/10 text-accent-dark font-semibold rounded-full px-2.5 py-1">
              <BadgeCheck size={14} /> Verified
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">{user.displayName}</h1>
            {isOwn && (
              <span className="text-[10px] bg-primary/10 text-primary font-semibold rounded-full px-2 py-0.5">
                This is you
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
          {profile?.location && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin size={12} /> {profile.location}
            </p>
          )}
        </div>

        <div className="flex gap-6 mt-3">
          <div>
            <p className="text-base font-bold flex items-center gap-1">
              <Zap size={14} className="text-primary" /> {profile?.points ?? 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Points</p>
          </div>
          <div>
            <p className="text-base font-bold flex items-center gap-1">
              <Heart size={14} className="text-accent" /> {profile?.likesCount ?? 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Likes</p>
          </div>
          <div>
            <p className="text-base font-bold">{profile?.age ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">Age</p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            About
          </h3>
          <p className="text-sm text-foreground leading-relaxed">
            {profile?.bio || "No bio yet."}
          </p>
        </div>

        {(profile?.interests?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile!.interests.map((ui) => (
              <span
                key={ui.id}
                className="text-[11px] bg-muted text-muted-foreground rounded-full px-3 py-1"
              >
                {ui.interest.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 mt-5">
        {isOwn ? (
          <Link href="/mine/essential-information">
            <Button className="w-full" variant="outline" size="lg">
              Edit Profile
            </Button>
          </Link>
        ) : (
          <ProfileActions
            targetUserId={user.id}
            targetUsername={user.username}
            isLiked={isLiked}
            isFollowing={isFollowing}
            isBlocked={!!blockedByMe}
          />
        )}
      </div>
    </div>
  );
}