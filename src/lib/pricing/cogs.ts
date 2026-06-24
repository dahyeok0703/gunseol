/**
 * AI 원가 계산 (마진 보호).
 *
 * 모델별 토큰 단가(USD/1M)와 환율로 호출당 원가(KRW)를 추정한다.
 * 이 값은 ai_usage.est_cost_krw 에 적재되어 마진/사용량 모니터링에 쓰인다.
 *
 * ⚠️ 단가·환율은 주기적으로 갱신해야 한다. 환율은 환경변수로 덮어쓸 수 있다.
 */

export type AiModel = "claude-haiku-4-5" | "claude-sonnet-4-6";

/** 모델별 토큰 단가 (USD per 1M tokens) */
export const MODEL_PRICING: Record<AiModel, { inputPerMTok: number; outputPerMTok: number }> = {
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5 },
  "claude-sonnet-4-6": { inputPerMTok: 3, outputPerMTok: 15 },
};

/** USD→KRW 환율 (원가 추정용). AI_USD_KRW 환경변수로 덮어쓰기 가능. */
export function usdToKrw(): number {
  const raw = process.env.AI_USD_KRW;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 1400;
}

/** 호출 1회의 추정 원가(KRW). 소수 2자리 반올림. */
export function estimateCostKrw(model: string, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[model as AiModel] ?? MODEL_PRICING["claude-haiku-4-5"];
  const usd =
    (inputTokens / 1_000_000) * p.inputPerMTok + (outputTokens / 1_000_000) * p.outputPerMTok;
  return Math.round(usd * usdToKrw() * 100) / 100;
}

/**
 * 추출 1회의 보수적(최대) 추정 토큰 — 마진 점검용.
 * 이미지(비전) + 폴백(Sonnet)까지 고려한 넉넉한 가정.
 */
const WORST_CASE_EXTRACTION = { model: "claude-sonnet-4-6", inputTokens: 3000, outputTokens: 1200 };

/** 추출 1회의 보수적 추정 원가(KRW). */
export function worstCaseExtractionCostKrw(): number {
  return estimateCostKrw(
    WORST_CASE_EXTRACTION.model,
    WORST_CASE_EXTRACTION.inputTokens,
    WORST_CASE_EXTRACTION.outputTokens,
  );
}

/**
 * plan 의 월 AI 쿼터를 전부 소진했을 때의 추정 AI 원가 상한(KRW).
 * 가격(설정값)과 비교해 plan 별 마진이 음수가 아닌지 점검한다.
 */
export function monthlyAiCostCeilingKrw(quota: number): number {
  if (!Number.isFinite(quota)) return Number.POSITIVE_INFINITY;
  return Math.round(worstCaseExtractionCostKrw() * quota);
}
