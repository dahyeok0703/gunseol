import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/context";
import { features } from "@/lib/env";
import { getCatalogPickerItems } from "@/lib/data/catalog";
import { getEstimateWithLines } from "@/lib/data/estimates";
import { PageHeader } from "@/components/app-shell/page-header";
import { EstimateBuilder } from "@/components/estimates/estimate-builder";

export const metadata: Metadata = { title: "견적 수정" };

export default async function EditEstimatePage({
  params,
}: {
  params: Promise<{ id: string; eid: string }>;
}) {
  const { id, eid } = await params;
  const ctx = await requireAuth();

  const [result, catalogItems] = await Promise.all([
    getEstimateWithLines(eid),
    getCatalogPickerItems(ctx.workspaceId),
  ]);

  if (!result || result.estimate.project_id !== id) notFound();
  const { estimate, lines } = result;

  return (
    <div>
      <PageHeader
        title="견적 수정"
        description={`저장하면 새 버전(v${estimate.version + 1})으로 저장됩니다.`}
      />
      <EstimateBuilder
        projectId={id}
        catalogItems={catalogItems}
        aiEnabled={features.aiExtraction}
        initial={{
          status: "draft",
          memo: estimate.memo ?? "",
          lines: lines.map((l) => ({
            category: l.category ?? "",
            name: l.name,
            unit: l.unit ?? "",
            qty: String(l.qty),
            unit_price: String(l.unit_price),
            cost: String(l.cost),
          })),
        }}
      />
    </div>
  );
}
