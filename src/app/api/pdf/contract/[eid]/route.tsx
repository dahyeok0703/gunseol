import { type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { getAuthContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { getEstimateWithLines } from "@/lib/data/estimates";
import { getPdfCompany } from "@/lib/data/workspace";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { ContractDocument } from "@/lib/pdf/contract-document";
import { pdfResponse } from "@/lib/pdf/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ⚠️ 계약서 표준 문구는 법무 검토가 필요한 예시 플레이스홀더다(contract-document.tsx 참고).

type ProjectLite = { name: string; client_name: string | null; site_address: string | null };

export async function GET(request: NextRequest, { params }: { params: Promise<{ eid: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return new Response("Unauthorized", { status: 401 });

  const { eid } = await params;
  const data = await getEstimateWithLines(eid);
  if (!data || data.estimate.workspace_id !== ctx.workspaceId) {
    return new Response("Not found", { status: 404 });
  }

  const supabase = await createClient();
  let project: ProjectLite | null = null;
  if (data.estimate.project_id) {
    const { data: p } = await supabase
      .from("project_overview")
      .select("name, client_name, site_address")
      .eq("id", data.estimate.project_id)
      .returns<ProjectLite[]>()
      .maybeSingle();
    project = p ?? null;
  }

  const company = await getPdfCompany(ctx.workspaceId);
  registerPdfFonts();

  const buffer = await renderToBuffer(
    <ContractDocument
      company={company}
      clientName={project?.client_name ?? null}
      projectName={project?.name ?? "현장"}
      siteAddress={project?.site_address ?? null}
      amount={data.estimate.total_price}
      createdAt={new Date().toISOString()}
    />,
  );

  return pdfResponse(buffer, `계약서_${project?.name ?? "현장"}`, request);
}
