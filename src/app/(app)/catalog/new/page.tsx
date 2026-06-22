import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/context";
import { getCatalogCategories } from "@/lib/data/catalog";
import { PageHeader } from "@/components/app-shell/page-header";
import { CatalogForm } from "@/components/catalog/catalog-form";

export const metadata: Metadata = { title: "새 품목" };

export default async function NewCatalogItemPage() {
  const ctx = await requireAuth();
  const categories = await getCatalogCategories(ctx.workspaceId);

  return (
    <div>
      <PageHeader title="새 품목" description="공정·품목과 견적/실행 단가를 입력하세요." />
      <CatalogForm mode="create" categories={categories.map((c) => c.name)} />
    </div>
  );
}
