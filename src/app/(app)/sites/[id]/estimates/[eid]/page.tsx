import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { getEstimateWithLines } from "@/lib/data/estimates";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app-shell/page-header";
import { EstimateStatusBadge } from "@/components/estimates/estimate-status-badge";
import { EstimateStatusControl } from "@/components/estimates/estimate-status-control";
import { EstimateView } from "@/components/estimates/estimate-view";

export const metadata: Metadata = { title: "견적 상세" };

type ProjectLite = Pick<
  Database["public"]["Views"]["project_overview"]["Row"],
  "id" | "name" | "client_name"
>;

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string; eid: string }>;
}) {
  const { id, eid } = await params;
  await requireAuth();
  const supabase = await createClient();

  const result = await getEstimateWithLines(eid);
  if (!result || result.estimate.project_id !== id) notFound();
  const { estimate, lines } = result;

  const { data: project } = await supabase
    .from("project_overview")
    .select("id, name, client_name")
    .eq("id", id)
    .returns<ProjectLite[]>()
    .maybeSingle();

  return (
    <div className="space-y-5">
      <PageHeader
        title={`견적 v${estimate.version}`}
        description={project?.name ?? undefined}
        action={
          <Button asChild size="sm" variant="outline">
            <Link href={`/sites/${id}/estimates/${eid}/edit`}>
              <Pencil className="size-4" /> 수정
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">상태</span>
            <EstimateStatusBadge status={estimate.status} />
          </div>
          <EstimateStatusControl id={estimate.id} status={estimate.status} />
          <p className="text-xs text-muted-foreground">
            수정하면 새 버전(v{estimate.version + 1})이 생성되고, 이 버전은 이력으로 남습니다.
          </p>
        </CardContent>
      </Card>

      <EstimateView estimate={estimate} lines={lines} clientName={project?.client_name ?? null} />
    </div>
  );
}
