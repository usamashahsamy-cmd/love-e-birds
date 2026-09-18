import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Gift } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import GiftRow from "./components/GiftRow";
import CreateGiftForm from "./components/CreateGiftForm";

export const dynamic = "force-dynamic";

export default async function AdminGiftsPage() {
  await requireAdmin();

  const gifts = await prisma.gift.findMany({
    orderBy: { value: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Gifts</h1>
      <p className="text-sm text-muted-foreground mb-5">Manage the Gift Store catalog.</p>

      <CreateGiftForm />

      {gifts.length === 0 ? (
        <EmptyState icon={Gift} title="No gifts yet" description="Add the first gift to the store." />
      ) : (
        <div className="space-y-3 mt-6">
          {gifts.map((g) => (
            <GiftRow
              key={g.id}
              gift={{
                id: g.id,
                name: g.name,
                type: g.type,
                value: Number(g.value.toString()),
                imageUrl: g.imageUrl,
                isActive: g.isActive,
                sold: g._count.transactions,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}