import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { features } from "@/lib/env";
import { getCatalogPickerItems } from "@/lib/data/catalog";
import type { Database } from "@/types/database";
import { PageHeader } from "@/components/app-shell/page-header";
import { EstimateBuilder } from "@/components/estimates/estimate-builder";

export const metadata: Metadata = { title: "새 견적" };

type ProjectLite = Pick<Database["public"]["Tables"]["projects"]["Row"], "id" | "name">;

export default async function NewEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireAuth();
  const supabase = await createClient();

  const [{ data: project }, catalogItems] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", id)
      .is("deleted_at", null)
      .returns<ProjectLite[]>()
      .maybeSingle(),
    getCatalogPickerItems(ctx.workspaceId),
  ]);

  if (!project) notFound();

  return (
    <div>
      <PageHeader title="새 견적" description={project.name} />
      <EstimateBuilder projectId={id} catalogItems={catalogItems} aiEnabled={features.aiExtraction} />
    </div>
  );
}
