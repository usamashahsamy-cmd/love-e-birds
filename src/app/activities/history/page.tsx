import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import HistoryList from "./components/HistoryList";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function ActivityHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page ?? 1)));

  const [total, rows] = await Promise.all([
    prisma.activityHistory.count({ where: { userId: session.user.id } }),
    prisma.activityHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-muted/40 pb-8">
      <header className="sticky top-0 z-30 gradient-primary text-white">
        <div className="flex items-center gap-3 px-4 h-12">
          <Link href="/activities/airborne-activities" className="p-1 -ml-1 rounded-full hover:bg-white/15">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-sm font-bold">Activity History</h1>
        </div>
      </header>

      <main className="px-4 pt-4">
        <HistoryList
          rows={rows.map((r) => ({
            id: r.id,
            activityTitle: r.activityTitle,
            productName: r.productName,
            quantity: r.quantity,
            ticketsUsed: r.ticketsUsed,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
          }))}
          page={page}
          totalPages={totalPages}
          total={total}
        />
      </main>
    </div>
  );
}
