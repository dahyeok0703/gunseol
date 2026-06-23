import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { features } from "@/lib/env";
import { getCatalogPickerItems, type CatalogPickerItem } from "@/lib/data/catalog";
import { extractLines, type ImageMediaType } from "@/lib/ai/extract";
import { estimateCostKrw } from "@/lib/pricing/cogs";
import { FREE_MONTHLY_EXTRACTIONS } from "@/lib/constants/plan";

/**
 * POST /api/extract — 사진/메모/텍스트에서 견적 항목 추출.
 *
 * 흐름: 인증 → AI 활성 확인 → free 쿼터 확인 → Claude 추출(Haiku→Sonnet 폴백)
 *      → 단가표 매칭으로 단가 채움 → 토큰/원가 ai_usage 적재 → 결과 반환.
 *
 * 🔒 PII 최소 전송: 추출에 필요한 입력만 처리하고, 원문은 저장/로깅하지 않는다.
 *    추출 결과는 항상 사용자가 검수·수정한다("초안").
 */

const bodySchema = z
  .object({
    projectId: z.string().uuid().optional(),
    text: z.string().max(20_000).optional(),
    image: z
      .object({
        data: z.string().min(1).max(8_000_000), // base64 (~6MB 원본)
        mediaType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
      })
      .optional(),
  })
  .refine((d) => Boolean(d.text?.trim()) || Boolean(d.image), {
    message: "텍스트 또는 사진이 필요합니다.",
  });

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, "");
}

/** 추출 품목명을 단가표와 매칭해 단가를 채운다 (사용자 본인의 단가). */
function matchCatalog(name: string, items: CatalogPickerItem[]): CatalogPickerItem | null {
  const n = norm(name);
  if (!n) return null;
  let partial: CatalogPickerItem | null = null;
  for (const it of items) {
    const inm = norm(it.name);
    if (inm === n) return it;
    if (!partial && (inm.includes(n) || n.includes(inm))) partial = it;
  }
  return partial;
}

export async function POST(request: NextRequest) {
  // 인증
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  // "키 없으면 우아하게 비활성"
  if (!features.aiExtraction) {
    return NextResponse.json(
      { ok: false, code: "disabled", error: "AI 추출이 비활성화되어 있습니다. 수동으로 입력해주세요." },
      { status: 503 },
    );
  }

  // 입력 검증
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = await createClient();

  // free 플랜 월 쿼터
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("plan")
    .eq("id", ctx.workspaceId)
    .returns<{ plan: "free" | "pro" }[]>()
    .maybeSingle();

  if (workspace?.plan === "free") {
    const { data: used } = await supabase.rpc("current_month_extractions", {
      p_workspace_id: ctx.workspaceId,
    });
    if ((used ?? 0) >= FREE_MONTHLY_EXTRACTIONS) {
      return NextResponse.json(
        {
          ok: false,
          code: "quota_exceeded",
          error: `이번 달 무료 AI 추출(${FREE_MONTHLY_EXTRACTIONS}회)을 모두 사용했어요. 수동 입력을 쓰거나 Pro 로 업그레이드하세요.`,
        },
        { status: 402 },
      );
    }
  }

  // 추출 + 단가표 매칭 (병렬)
  let result;
  let catalog: CatalogPickerItem[];
  try {
    [result, catalog] = await Promise.all([
      extractLines({
        text: body.text,
        image: body.image
          ? { data: body.image.data, mediaType: body.image.mediaType as ImageMediaType }
          : undefined,
      }),
      getCatalogPickerItems(ctx.workspaceId),
    ]);
  } catch (error) {
    console.error("[extract] 추출 실패:", error);
    return NextResponse.json(
      { ok: false, error: "추출에 실패했어요. 잠시 후 다시 시도하거나 수동으로 입력해주세요." },
      { status: 502 },
    );
  }

  const lines = result.lines.map((l) => {
    const m = matchCatalog(l.name, catalog);
    return {
      category: l.category || m?.category || "",
      name: l.name,
      unit: l.unit || m?.unit || "",
      qty: l.qty,
      // 단가는 단가표(사용자 본인 데이터)에서 채운다 — AI 는 금액 판단 안 함
      unit_price: m?.default_unit_price ?? 0,
      cost: m?.default_cost ?? 0,
      confidence: l.confidence,
      matched: Boolean(m),
    };
  });

  // 토큰/원가 적재 (best-effort: 실패해도 결과는 반환)
  const totals = result.usage.reduce(
    (acc, u) => ({
      input: acc.input + u.input,
      output: acc.output + u.output,
      cost: acc.cost + estimateCostKrw(u.model, u.input, u.output),
    }),
    { input: 0, output: 0, cost: 0 },
  );
  try {
    await supabase.rpc("record_ai_usage", {
      p_workspace_id: ctx.workspaceId,
      p_input_tokens: totals.input,
      p_output_tokens: totals.output,
      p_doc_count: 1,
      p_est_cost_krw: Math.round(totals.cost * 100) / 100,
    });
  } catch (error) {
    console.error("[extract] ai_usage 적재 실패:", error);
  }

  const needsReview = result.overallConfidence === "low" || lines.some((l) => l.confidence === "low");

  return NextResponse.json({
    ok: true,
    data: {
      lines,
      overallConfidence: result.overallConfidence,
      needsReview,
      model: result.model,
    },
  });
}
