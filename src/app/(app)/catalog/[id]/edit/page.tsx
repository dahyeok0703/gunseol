import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/context";
import { getCatalogCategories, getCatalogItem } from "@/lib/data/catalog";
import { PageHeader } from "@/components/app-shell/page-header";
import { CatalogForm } from "@/components/catalog/catalog-form";
import { EntityDeleteButton } from "@/components/entity-delete-button";

export const metadata: Metadata = { title: "품목 수정" };

export default async function EditCatalogItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuth();

  const [item, categories] = await Promise.all([
    getCatalogItem(id),
    getCatalogCategories(ctx.workspaceId),
  ]);

  if (!item) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="품목 수정" />
      <CatalogForm
        mode="edit"
        itemId={id}
        categories={categories.map((c) => c.name)}
        defaultValues={{
          category: item.category ?? "",
          name: item.name,
          unit: item.unit ?? "",
          default_unit_price: item.default_unit_price,
          default_cost: item.default_cost,
        }}
      />
      <EntityDeleteButton kind="catalog" id={id} redirectTo="/catalog" label="품목" />
    </div>
  );
}
