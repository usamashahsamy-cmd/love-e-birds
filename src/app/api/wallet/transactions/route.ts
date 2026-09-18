import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Math.floor(Number(searchParams.get("page") ?? 1)));
  const pageSize = Math.min(50, Math.max(1, Math.floor(Number(searchParams.get("pageSize") ?? 10))));

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
  if (!wallet) {
    return NextResponse.json({ success: true, total: 0, page, pageSize, transactions: [] });
  }

  const [total, rows] = await Promise.all([
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    success: true,
    total,
    page,
    pageSize,
    transactions: rows.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount.toString()),
      direction: t.direction,
      description: t.description,
      balanceAfter: Number(t.balanceAfter.toString()),
      referenceId: t.referenceId,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
