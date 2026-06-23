"use client";

import { useState } from "react";
import { Eye, EyeOff, Info } from "lucide-react";

import { cn, formatKRW, calcMargin } from "@/lib/utils";
import { ESTIMATE_DISCLAIMER } from "@/lib/constants/disclaimer";
import type { Estimate, EstimateLine } from "@/lib/data/estimates";
import { MarginSummary } from "@/components/estimates/margin-summary";

/**
 * 견적 상세 보기.
 * - 고객 제출용: 견적가만 노출 (실행가·마진 숨김)
 * - 내부용: 실행가·마진 포함 (toggle)
 */
export function EstimateView({
  estimate,
  lines,
  clientName,
}: {
  estimate: Estimate;
  lines: EstimateLine[];
  clientName: string | null;
}) {
  const [internal, setInternal] = useState(true);

  return (
    <div className="space-y-4">
      {/* 보기 토글 */}
      <div className="flex rounded-lg bg-secondary p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setInternal(true)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 transition-colors",
            internal ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          <Eye className="size-4" /> 내부용 (마진)
        </button>
        <button
          type="button"
          onClick={() => setInternal(false)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 transition-colors",
            !internal ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          <EyeOff className="size-4" /> 고객 제출용
        </button>
      </div>

      {/* 내부용에서만 마진 요약 ★ */}
      {internal ? (
        <MarginSummary price={estimate.total_price} cost={estimate.total_cost} />
      ) : null}

      {/* 고객 정보 (제출용 머리글) */}
      {clientName ? (
        <p className="text-sm text-muted-foreground">
          수신: <span className="font-medium text-foreground">{clientName}</span> 귀하
        </p>
      ) : null}

      {/* 라인 */}
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {lines.map((l) => {
          const amount = l.qty * l.unit_price;
          const costAmount = l.qty * l.cost;
          const { margin, rate } = calcMargin(amount, costAmount);
          const loss = margin < 0;
          return (
            <li key={l.id} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[l.category, l.unit].filter(Boolean).join(" · ")}
                    {l.category || l.unit ? " · " : ""}
                    {l.qty} × {formatKRW(l.unit_price)}
                  </p>
                </div>
                <p className="num shrink-0 font-bold">{formatKRW(amount)}</p>
              </div>
              {internal ? (
                <div className="mt-1.5 flex items-center justify-between border-t border-dashed border-border pt-1.5 text-xs">
                  <span className="text-muted-foreground">
                    실행 {formatKRW(costAmount)} ({formatKRW(l.cost)}/{l.unit || "단위"})
                  </span>
                  <span className={cn("num font-semibold", loss ? "text-loss" : "text-profit")}>
                    마진 {formatKRW(margin)} ({rate}%)
                  </span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* 합계 */}
      <div className="rounded-lg bg-secondary p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">총 견적가</span>
          <span className="num text-2xl font-bold">{formatKRW(estimate.total_price)}</span>
        </div>
        {internal ? (
          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>총 실행가 {formatKRW(estimate.total_cost)}</span>
            <span className="num font-semibold text-profit">
              마진 {formatKRW(estimate.total_price - estimate.total_cost)} (
              {calcMargin(estimate.total_price, estimate.total_cost).rate}%)
            </span>
          </div>
        ) : null}
      </div>

      {estimate.memo ? (
        <p className="whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-sm">
          {estimate.memo}
        </p>
      ) : null}

      {/* 책임 고지 ⚠️ */}
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {ESTIMATE_DISCLAIMER}
      </p>
    </div>
  );
}
