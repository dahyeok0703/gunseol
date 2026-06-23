import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { PdfCompany } from "@/lib/pdf/shared";

type CompanyRow = Pick<
  Database["public"]["Tables"]["workspaces"]["Row"],
  | "name"
  | "biz_name"
  | "biz_owner"
  | "biz_reg_no"
  | "biz_phone"
  | "biz_address"
  | "logo_path"
  | "stamp_path"
>;

const COLUMNS = "name, biz_name, biz_owner, biz_reg_no, biz_phone, biz_address, logo_path, stamp_path";

export async function getCompanyRow(workspaceId: string): Promise<CompanyRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspaces")
    .select(COLUMNS)
    .eq("id", workspaceId)
    .returns<CompanyRow[]>()
    .maybeSingle();
  return data ?? null;
}

/** 브랜드 자산(로고/도장)을 Storage 에서 받아 PDF 임베드용 data URL 로 변환 */
async function loadImageDataUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  try {
    const { data, error } = await supabase.storage.from("brand").download(path);
    if (error || !data) return null;
    const buf = Buffer.from(await data.arrayBuffer());
    const mime = data.type || "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** PDF 출력용 업체 프로필 (이미지 임베드 포함) */
export async function getPdfCompany(workspaceId: string): Promise<PdfCompany> {
  const supabase = await createClient();
  const { data: ws } = await supabase
    .from("workspaces")
    .select(COLUMNS)
    .eq("id", workspaceId)
    .returns<CompanyRow[]>()
    .maybeSingle();

  const [logoDataUrl, stampDataUrl] = await Promise.all([
    loadImageDataUrl(supabase, ws?.logo_path ?? null),
    loadImageDataUrl(supabase, ws?.stamp_path ?? null),
  ]);

  return {
    name: ws?.name ?? "내 업체",
    bizName: ws?.biz_name ?? null,
    bizOwner: ws?.biz_owner ?? null,
    bizRegNo: ws?.biz_reg_no ?? null,
    bizPhone: ws?.biz_phone ?? null,
    bizAddress: ws?.biz_address ?? null,
    logoDataUrl,
    stampDataUrl,
  };
}
