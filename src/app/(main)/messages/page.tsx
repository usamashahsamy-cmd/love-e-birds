import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageCircle, BadgeCheck } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const me = session.user.id;

  const memberships = await prisma.conversationMember.findMany({
    where: { userId: me },
    select: { conversationId: true, lastReadAt: true },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  type Row = {
    id: string;
    other: {
      username: string;
      displayName: string;
      avatar: string | null;
      isVerified: boolean;
    };
    lastMessage: { content: string; senderId: string; createdAt: Date } | null;
    unread: number;
    updatedAt: Date;
  };

  const rows: Row[] = [];
  for (const m of memberships) {
    const [conversation, unread] = await Promise.all([
      prisma.conversation.findUniqueOrThrow({
        where: { id: m.conversationId },
        include: {
          members: {
            where: { userId: { not: me } },
            include: { user: { include: { profile: true } } },
          },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      prisma.message.count({
        where: {
          conversationId: m.conversationId,
          NOT: { senderId: me },
          createdAt: { gt: m.lastReadAt ?? new Date(0) },
        },
      }),
    ]);
    const otherMember = conversation.members[0];
    if (!otherMember) continue;
    const other = otherMember.user;
    rows.push({
      id: conversation.id,
      other: {
        username: other.username,
        displayName: other.displayName,
        avatar: other.avatar,
        isVerified: other.profile?.isVerified ?? false,
      },
      lastMessage: conversation.messages[0]
        ? {
            content: conversation.messages[0].content,
            senderId: conversation.messages[0].senderId,
            createdAt: conversation.messages[0].createdAt,
          }
        : null,
      unread,
      updatedAt: conversation.updatedAt,
    });
  }

  rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <h1 className="text-lg font-bold mb-4">Messages</h1>
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Messages with your matches will appear here."
        />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <h1 className="text-lg font-bold px-4 pt-4 mb-3">Messages</h1>
      <div className="space-y-2 px-4">
        {rows.map((row) => {
          const mine = row.lastMessage?.senderId === me;
          return (
            <Link
              key={row.id}
              href={`/messages/${row.other.username}`}
              className="flex items-center gap-3 bg-card border border-card-border rounded-xl px-3 py-3 hover:border-primary/40 transition-colors"
            >
              <div className="relative flex-shrink-0">
                {row.other.avatar ? (
                  <Image
                    src={row.other.avatar}
                    alt={row.other.displayName}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-base font-bold text-muted-foreground">
                      {row.other.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">{row.other.displayName}</p>
                  {row.other.isVerified && (
                    <BadgeCheck size={14} className="text-accent flex-shrink-0" />
                  )}
                </div>
                <p
                  className={`text-xs truncate mt-0.5 ${
                    row.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {row.lastMessage
                    ? `${mine ? "You: " : ""}${row.lastMessage.content}`
                    : "Say hello 👋"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {row.lastMessage ? (
                  <p className="text-[9px] text-muted-foreground">
                    {row.lastMessage.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                ) : null}
                {row.unread > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                    {row.unread > 9 ? "9+" : row.unread}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}