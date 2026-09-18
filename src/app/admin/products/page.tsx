import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Package } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ProductForm from "./components/ProductForm";
import ProductRow from "./components/ProductRow";
import CategoryForm from "./components/CategoryForm";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true, _count: { select: { activityProducts: true } } },
    }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Products</h1>
      <p className="text-sm text-muted-foreground mb-5">Manage the product catalog for activities.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <ProductForm categories={categoryOptions} />
        </div>
        <CategoryForm />
      </div>

      {products.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" description="Add the first product to the catalog." />
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <ProductRow
              key={p.id}
              product={{
                id: p.id,
                name: p.name,
                description: p.description,
                imageUrl: p.imageUrl,
                ticketCost: p.ticketCost,
                active: p.active,
                categoryId: p.categoryId,
                categoryName: p.category?.name ?? null,
                usedIn: p._count.activityProducts,
              }}
              categories={categoryOptions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
