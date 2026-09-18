import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActivityByIdOrSlug, serializeActivity } from "@/lib/activities";
import ActivityClient from "./components/ActivityClient";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { activityId } = await params;
  const activity = await getActivityByIdOrSlug(activityId);
  if (!activity) notFound();

  const [user, links, selection, participation] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { wallet: true },
    }),
    prisma.activityProduct.findMany({
      where: { activityId: activity.id, product: { active: true } },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      include: { product: true },
    }),
    prisma.productSelection.findUnique({
      where: { userId_activityId: { userId: session.user.id, activityId: activity.id } },
    }),
    prisma.activityParticipation.findUnique({
      where: { activityId_userId: { activityId: activity.id, userId: session.user.id } },
    }),
  ]);

  if (!user) redirect("/login");

  const serialized = serializeActivity(activity);
  const products = links.map((l) => ({
    id: l.product.id,
    name: l.product.name,
    description: l.product.description,
    imageUrl: l.product.imageUrl,
    ticketCost: l.product.ticketCost,
    displayOrder: l.displayOrder,
    isFeatured: l.isFeatured,
  }));

  const alreadyParticipated = !!participation && participation.status !== "CANCELLED";

  return (
    <ActivityClient
      activity={serialized}
      user={{
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        balance: user.wallet ? Number(user.wallet.balance.toString()) : 0,
      }}
      products={products}
      initialSelection={
        selection && products.some((p) => p.id === selection.productId)
          ? { productId: selection.productId, quantity: selection.quantity }
          : null
      }
      alreadyParticipated={alreadyParticipated}
    />
  );
}
