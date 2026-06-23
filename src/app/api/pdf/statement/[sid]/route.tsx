import { type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { getAuthContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { getStatement } from "@/lib/data/statements";
import { getPdfCompany } from "@/lib/data/workspace";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { StatementDocument } from "@/lib/pdf/statement-document";
import { pdfResponse } from "@/lib/pdf/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ sid: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return new Response("Unauthorized", { status: 401 });

  const { sid } = await params;
  const statement = await getStatement(sid);
  if (!statement || statement.workspace_id !== ctx.workspaceId) {
    return new Response("Not found", { status: 404 });
  }

  let projectName: string | null = null;
  if (statement.project_id) {
    const supabase = await createClient();
    const { data: p } = await supabase
      .from("projects")
      .select("name")
      .eq("id", statement.project_id)
      .returns<{ name: string }[]>()
      .maybeSingle();
    projectName = p?.name ?? null;
  }

  const company = await getPdfCompany(ctx.workspaceId);
  registerPdfFonts();

  const buffer = await renderToBuffer(
    <StatementDocument company={company} statement={statement} projectName={projectName} />,
  );

  const label = statement.type === "purchase_order" ? "발주서" : "거래명세서";
  return pdfResponse(buffer, `${label}_${statement.vendor ?? ""}`, request);
}
