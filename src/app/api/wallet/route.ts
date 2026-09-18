import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const [wallet, profile] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({
    success: true,
    wallet: {
      balance: wallet ? Number(wallet.balance.toString()) : 0,
      frozenBalance: wallet ? Number(wallet.frozenBalance.toString()) : 0,
      totalEarned: wallet ? Number(wallet.totalEarned.toString()) : 0,
      totalSpent: wallet ? Number(wallet.totalSpent.toString()) : 0,
      currency: wallet?.currency ?? "INR",
    },
    points: profile?.points ?? 0,
    tickets: wallet ? Number(wallet.balance.toString()) : 0,
  });
}
