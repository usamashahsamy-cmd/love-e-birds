import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  Users,
  Heart,
  Flag,
  ShieldCheck,
  Banknote,
  Gift,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function loadDashboardStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    newUsers30d,
    matches,
    pendingReports,
    pendingVerifications,
    pendingWithdrawals,
    withdrawalTotal,
    walletAgg,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "USER", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "USER", createdAt: { gte: thirtyDaysAgo } } }),
    prisma.match.count({ where: { status: "ACTIVE" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.verification.count({ where: { status: "PENDING" } }),
    prisma.withdrawal.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.withdrawal.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["PENDING", "PROCESSING"] } },
    }),
    prisma.wallet.aggregate({
      _sum: { balance: true, totalSpent: true },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    newUsers30d,
    matches,
    pendingReports,
    pendingVerifications,
    pendingWithdrawals,
    withdrawalTotal,
    walletAgg,
  };
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const {
    totalUsers,
    activeUsers,
    newUsers30d,
    matches,
    pendingReports,
    pendingVerifications,
    pendingWithdrawals,
    withdrawalTotal,
    walletAgg,
  } = await loadDashboardStats();

  const stats: {
    label: string;
    value: string;
    href?: string;
    accent: string;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
  }[] = [
    { label: "Total users", value: totalUsers.toLocaleString("en-IN"), href: "/admin/users", accent: "text-primary", icon: Users },
    { label: "Active users", value: activeUsers.toLocaleString("en-IN"), href: "/admin/users", accent: "text-success", icon: Users },
    { label: "New (30d)", value: newUsers30d.toLocaleString("en-IN"), href: "/admin/users", accent: "text-accent", icon: TrendingUp },
    { label: "Matches", value: matches.toLocaleString("en-IN"), accent: "text-accent", icon: Heart },
    { label: "Pending reports", value: pendingReports.toLocaleString("en-IN"), href: "/admin/reports", accent: "text-destructive", icon: Flag },
    { label: "Pending verifications", value: pendingVerifications.toLocaleString("en-IN"), href: "/admin/verifications", accent: "text-warning", icon: ShieldCheck },
    { label: "Pending withdrawals", value: pendingWithdrawals.toLocaleString("en-IN"), href: "/admin/withdrawals", accent: "text-warning", icon: Banknote },
    { label: "Withdrawal queue value", value: `₹${(withdrawalTotal._sum.amount ? Number(withdrawalTotal._sum.amount.toString()) : 0).toLocaleString("en-IN")}`, href: "/admin/withdrawals", accent: "text-primary", icon: Banknote },
    { label: "Total balances", value: `₹${(walletAgg._sum.balance ? Number(walletAgg._sum.balance.toString()) : 0).toLocaleString("en-IN")}`, accent: "text-success", icon: Gift },
    { label: "Total spent", value: `₹${(walletAgg._sum.totalSpent ? Number(walletAgg._sum.totalSpent.toString()) : 0).toLocaleString("en-IN")}`, accent: "text-destructive", icon: TrendingUp },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-5">Platform overview</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          const inner = (
            <>
              <Icon size={18} className={s.accent} />
              <p className="text-lg font-bold mt-2">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </>
          );
          return s.href ? (
            <Link
              key={s.label}
              href={s.href}
              className="bg-card border border-card-border rounded-2xl p-4 hover:border-primary/40 transition-colors"
            >
              {inner}
            </Link>
          ) : (
            <div key={s.label} className="bg-card border border-card-border rounded-2xl p-4">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}