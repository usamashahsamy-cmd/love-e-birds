import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Gift, PackageOpen } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import GiftRecordList from "./components/GiftRecordList";

export const dynamic = "force-dynamic";

export default async function GiftRecordPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [received, sent] = await Promise.all([
    prisma.giftTransaction.findMany({
      where: { receiverId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        gift: true,
        sender: true,
      },
    }),
    prisma.giftTransaction.findMany({
      where: { senderId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        gift: true,
        receiver: true,
      },
    }),
  ]);

  const totalReceived = received.reduce((sum, g) => sum + g.points, 0);
  const totalSent = sent.reduce((sum, g) => sum + g.points, 0);

  if (received.length === 0 && sent.length === 0) {
    return (
      <div className="px-4 pt-4 pb-6">
        <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Gift size={20} className="text-accent" /> Gift Record
        </h1>
        <EmptyState
          icon={PackageOpen}
          title="No gifts yet"
          description="Gifts you send and receive appear here. Visit the Gift Store to send your first one."
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Gift size={20} className="text-accent" /> Gift Record
      </h1>
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-card border border-card-border rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">Received</p>
          <p className="text-sm font-bold text-success">
            +{totalReceived.toLocaleString("en-IN")} pts
          </p>
        </div>
        <div className="flex-1 bg-card border border-card-border rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">Sent</p>
          <p className="text-sm font-bold text-muted-foreground">
            {totalSent.toLocaleString("en-IN")} pts
          </p>
        </div>
      </div>
      <GiftRecordList received={received} sent={sent} />
    </div>
  );
}