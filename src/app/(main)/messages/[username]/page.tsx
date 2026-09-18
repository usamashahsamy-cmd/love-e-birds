import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, MessageCircle } from "lucide-react";
import ChatThread from "./components/ChatThread";

export const dynamic = "force-dynamic";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const me = session.user.id;
  const { username } = await params;

  const other = await prisma.user.findUnique({
    where: { username },
    include: { profile: true },
  });
  if (!other) redirect("/messages");

  if (other.id === me) redirect("/messages");

  const matched =
    (await prisma.match.count({
      where: {
        status: "ACTIVE",
        OR: [
          { userId: me, targetId: other.id },
          { userId: other.id, targetId: me },
        ],
      },
    })) > 0;

  let conversationId: string | null = null;
  let lastReadAt: Date | null = null;
  const messages: {
    id: string;
    senderId: string;
    content: string;
    createdAt: Date;
  }[] = [];

  if (matched) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        members: { every: { userId: { in: [me, other.id] } } },
      },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 200 },
        members: { where: { userId: me } },
      },
    });
    if (conversation) {
      conversationId = conversation.id;
      lastReadAt = conversation.members[0]?.lastReadAt ?? null;
      messages.push(...conversation.messages);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-card-border flex-shrink-0">
        <div className="flex items-center gap-3 h-12 px-3">
          <Link href="/messages" aria-label="Back" className="p-1 -ml-1 rounded-full hover:bg-muted">
            <ArrowLeft size={22} className="text-foreground" />
          </Link>
          <Link href={`/profile/${other.username}`} className="flex items-center gap-2 min-w-0">
            {other.avatar ? (
              <Image
                src={other.avatar}
                alt={other.displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">
                  {other.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-semibold text-sm truncate">
              {other.displayName}
              {other.profile?.isOnline && (
                <span className="ml-1.5 text-[10px] font-medium text-success uppercase">online</span>
              )}
            </span>
          </Link>
        </div>
      </div>

      {!matched ? (
        <div className="flex flex-col items-center justify-center flex-1 px-4 py-16 text-center">
          <MessageCircle size={40} className="text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">You&apos;re not matched yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-[260px]">
            You can only message people you have matched with.
          </p>
          <Link href="/home" className="text-sm text-primary font-medium">
            Discover people →
          </Link>
        </div>
      ) : (
        <ChatThread
          conversationId={conversationId}
          myId={me}
          other={{
            username: other.username,
            displayName: other.displayName,
            avatar: other.avatar,
          }}
          initialMessages={messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
          }))}
          lastReadAt={lastReadAt?.toISOString() ?? null}
        />
      )}
    </div>
  );
}