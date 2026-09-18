import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ImageIcon } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import BannerRow from "./components/BannerRow";
import BannerForm from "./components/BannerForm";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  await requireAdmin();

  const banners = await prisma.banner.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }],
    take: 100,
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Banners</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Manage home carousel banners and the verification page VIP banner. Recommended size: 1200×400 px.
      </p>

      <div className="mb-6">
        <BannerForm />
      </div>

      {banners.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No banners" description="Create your first banner." />
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <BannerRow
              key={b.id}
              banner={{
                id: b.id,
                slug: b.slug,
                title: b.title,
                subtitle: b.subtitle,
                imageUrl: b.imageUrl,
                linkUrl: b.linkUrl,
                sortOrder: b.sortOrder,
                isActive: b.isActive,
                createdAt: b.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
