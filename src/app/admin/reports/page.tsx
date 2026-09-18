import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Flag } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ReportCard from "./components/ReportCard";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdmin();

  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      reporter: true,
      target: true,
      reviewedBy: true,
    },
  });

  if (reports.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-5">Reports</h1>
        <EmptyState icon={Flag} title="No reports" description="User reports will appear here." />
      </div>
    );
  }

  const statusOrder = ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"];
  const sorted = [...reports].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Reports</h1>
      <p className="text-sm text-muted-foreground mb-5">Review user reports and take action.</p>
      <div className="space-y-4">
        {sorted.map((report) => (
          <ReportCard
            key={report.id}
            report={{
              id: report.id,
              status: report.status,
              type: report.type,
              reason: report.reason,
              adminNote: report.adminNote,
              createdAt: report.createdAt.toISOString(),
              reporter: {
                username: report.reporter.username,
                displayName: report.reporter.displayName,
                email: report.reporter.email,
              },
              target: {
                id: report.target.id,
                username: report.target.username,
                displayName: report.target.displayName,
                email: report.target.email,
                status: report.target.status,
              },
            }}
          />
        ))}
      </div>
    </div>
  );
}