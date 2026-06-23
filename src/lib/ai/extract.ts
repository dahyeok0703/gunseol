import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { AiModel } from "@/lib/pricing/cogs";

/**
 * AI 견적 항목 추출 — 추출·정리만, 금액 판단은 하지 않는다.
 *
 * 정책(CLAUDE.md):
 *   · AI 는 사진/메모/텍스트에서 "견적 항목"만 추출한다(공정·품목·수량·단위).
 *   · 단가·금액·마진은 AI 가 생성/판단하지 않는다 → 단가는 단가표 매칭으로 채운다.
 *   · 모델은 Haiku 고정, 저신뢰/실패 시에만 Sonnet 1회 폴백.
 *
 * 🔒 PII 최소 전송: 추출에 필요한 텍스트/이미지만 Anthropic 으로 보낸다.
 *    원문은 저장·로깅하지 않는다(토큰 집계만 ai_usage 에 남긴다).
 */

export const AI_MODELS = {
  primary: "claude-haiku-4-5",
  fallback: "claude-sonnet-4-6",
} as const satisfies Record<string, AiModel>;

export type Confidence = "high" | "medium" | "low";
export type ImageMediaType = "image/png" | "image/jpeg" | "image/webp" | "image/gif";

export interface ExtractInput {
  text?: string;
  image?: { data: string; mediaType: ImageMediaType };
}

export interface RawExtractLine {
  category: string;
  name: string;
  qty: number;
  unit: string;
  confidence: Confidence;
}

export interface ExtractResult {
  lines: RawExtractLine[];
  overallConfidence: Confidence;
  model: AiModel;
  usage: Array<{ model: AiModel; input: number; output: number }>;
}

const SYSTEM_PROMPT = `너는 한국 인테리어 견적 작성 보조 도구다.
카카오톡 대화 캡처, 손으로 쓴 메모 사진, 또는 붙여넣은 텍스트에서 "견적 항목 후보"만 추출한다.

규칙:
- 각 항목에 대해 공정(category, 예: 철거/목공/도배/타일/전기/설비/도장), 품목명(name), 수량(qty, 숫자), 단위(unit, 예: ㎡/개/식/m)를 추정한다.
- **단가·금액·마진은 절대 생성하거나 추정하지 않는다.** 가격 관련 숫자는 출력하지 않는다.
- 수량이 불명확하면 1로 두고 confidence 를 낮춘다. 단위가 불명확하면 빈 문자열로 둔다.
- 인사말·잡담·연락처 등 견적과 무관한 내용은 제외한다.
- 확신이 낮은 항목은 confidence 를 "low" 로 표시한다.

반드시 아래 JSON 만 출력한다(코드블록·설명 금지):
{"lines":[{"category":string,"name":string,"qty":number,"unit":string,"confidence":"high"|"medium"|"low"}],"overall_confidence":"high"|"medium"|"low"}`;

const resultSchema = z.object({
  lines: z
    .array(
      z.object({
        category: z.string().trim().max(40).default(""),
        name: z.string().trim().min(1).max(80),
        qty: z.coerce.number().min(0).max(1_000_000).catch(1),
        unit: z.string().trim().max(20).default(""),
        confidence: z.enum(["high", "medium", "low"]).catch("low"),
      }),
    )
    .max(100),
  overall_confidence: z.enum(["high", "medium", "low"]).catch("low"),
});

let cached: Anthropic | null | undefined;
function getClient(): Anthropic | null {
  if (cached !== undefined) return cached;
  // server-only 모듈 — 선택 키는 process.env 에서 직접 읽는다(features 플래그와 동일).
  const key = process.env.ANTHROPIC_API_KEY;
  cached = key ? new Anthropic({ apiKey: key }) : null;
  return cached;
}

/** 응답 텍스트에서 첫 JSON 객체를 안전하게 파싱 */
function safeParse(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("JSON 응답을 찾을 수 없습니다.");
  const json = JSON.parse(text.slice(start, end + 1));
  return resultSchema.parse(json);
}

async function callModel(client: Anthropic, model: AiModel, input: ExtractInput) {
  const content: Anthropic.ContentBlockParam[] = [];
  if (input.image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: input.image.mediaType, data: input.image.data },
    });
    content.push({ type: "text", text: "이 이미지에서 견적 항목을 추출해줘." });
  }
  if (input.text?.trim()) {
    content.push({ type: "text", text: `다음 내용에서 견적 항목을 추출해줘:\n\n${input.text.trim()}` });
  }

  const res = await client.messages.create({
    model,
    max_tokens: 2048,
    // 시스템 프롬프트는 고정 → prompt caching
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = safeParse(text);
  return {
    parsed,
    usage: { model, input: res.usage.input_tokens, output: res.usage.output_tokens },
  };
}

export function isAiEnabled(): boolean {
  return getClient() !== null;
}

export async function extractLines(input: ExtractInput): Promise<ExtractResult> {
  const client = getClient();
  if (!client) throw new Error("AI 추출이 비활성화되어 있습니다.");

  const usage: ExtractResult["usage"] = [];

  // 1차: Haiku
  try {
    const r = await callModel(client, AI_MODELS.primary, input);
    usage.push(r.usage);
    if (r.parsed.overall_confidence !== "low") {
      return {
        lines: r.parsed.lines,
        overallConfidence: r.parsed.overall_confidence,
        model: AI_MODELS.primary,
        usage,
      };
    }
    // 저신뢰 → Sonnet 1회 폴백
  } catch {
    // 실패 → Sonnet 1회 폴백
  }

  // 2차: Sonnet (폴백)
  const r2 = await callModel(client, AI_MODELS.fallback, input);
  usage.push(r2.usage);
  return {
    lines: r2.parsed.lines,
    overallConfidence: r2.parsed.overall_confidence,
    model: AI_MODELS.fallback,
    usage,
  };
}
