import { cn, formatKRW, calcMargin } from "@/lib/utils";

/**
 * 현장 마진 요약 — 이 제품의 차별점.
 * 견적가 대비 실행가/마진 비율을 막대로 시각화하고 마진을 큼직하게 보여준다.
 */
export function MarginSummary({
  price,
  cost,
  className,
  compact = false,
}: {
  price: number;
  cost: number;
  className?: string;
  compact?: boolean;
}) {
  const { margin, rate } = calcMargin(price, cost);
  const loss = margin < 0;

  // 막대 비율 (견적가 기준)
  const costPct = price > 0 ? Math.min(100, (cost / price) * 100) : 0;
  const marginPct = price > 0 && !loss ? Math.max(0, 100 - costPct) : 0;

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">현장 마진</p>
          <p
            className={cn(
              "num font-bold leading-none",
              compact ? "text-2xl" : "text-3xl",
              loss ? "text-loss" : "text-profit",
            )}
          >
            {formatKRW(margin)}
          </p>
        </div>
        <div
          className={cn(
            "num rounded-lg px-2.5 py-1 text-sm font-bold",
            loss ? "bg-loss/15 text-loss" : "bg-profit/15 text-profit",
          )}
        >
          {loss ? "" : "+"}
          {rate}%
        </div>
      </div>

      {/* 비율 막대: 실행가(원가) | 마진 */}
      <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-muted-foreground/50" style={{ width: `${costPct}%` }} />
        <div
          className={cn("h-full", loss ? "bg-loss" : "bg-profit")}
          style={{ width: `${loss ? 100 - costPct : marginPct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div>
          <p className="text-xs text-muted-foreground">총 견적가</p>
          <p className="num font-bold">{formatKRW(price)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">총 실행가</p>
          <p className="num font-bold text-muted-foreground">{formatKRW(cost)}</p>
        </div>
      </div>
    </div>
  );
}
