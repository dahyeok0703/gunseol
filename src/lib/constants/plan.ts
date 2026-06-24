import type { WorkspacePlan } from "@/types/database";

/** Pro 월 구독료 (설정값) */
export const PRO_PRICE_KRW = 19000;

/** free 플랜 월 AI 추출 한도 (마진 보호) */
export const FREE_MONTHLY_EXTRACTIONS = 30;
/** pro 플랜 월 AI 추출 한도 (넉넉) */
export const PRO_MONTHLY_EXTRACTIONS = 1000;

export interface PlanLimits {
  /** 현장 최대 개수 (Infinity = 무제한) */
  maxProjects: number;
  /** 월 AI 추출 횟수 */
  aiExtractions: number;
  /** 출력물 워터마크 표시 여부 */
  watermark: boolean;
}

export const PLAN_LIMITS: Record<WorkspacePlan, PlanLimits> = {
  free: { maxProjects: 3, aiExtractions: FREE_MONTHLY_EXTRACTIONS, watermark: true },
  pro: { maxProjects: Number.POSITIVE_INFINITY, aiExtractions: PRO_MONTHLY_EXTRACTIONS, watermark: false },
};

export function planLimits(plan: WorkspacePlan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}
