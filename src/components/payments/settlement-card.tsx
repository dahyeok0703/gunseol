import { Info } from "lucide-react";
import { cn, formatKRW } from "@/lib/utils";
import { FINANCE_DISCLAIMER } from "@/lib/constants/disclaimer";
import { Card, CardContent } from "@/components/ui/card";
import type { Settlement } from "@/lib/data/finance";

/** 현장 정산 카드 — 견적가/실행가/실제 지출/수금 + 견적 마진 vs 실제 마진 */
export function SettlementCard({ s }: { s: Settlement }) {
  const quoteLoss = s.quoteMargin < 0;
  const actualLoss = s.actualMargin < 0;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">현장 정산</h3>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <Stat label="견적가" value={formatKRW(s.quotePrice)} />
          <Stat label="실행가(예상)" value={formatKRW(s.quoteCost)} muted />
          <Stat label="실제 지출" value={formatKRW(s.actualSpend)} muted />
          <Stat label="수금액" value={formatKRW(s.collected)} />
        </div>

        {/* 받을 돈 */}
        <div className="flex items-center justify-between rounded-lg bg-warning/10 px-3 py-2.5">
          <span className="text-sm font-medium">받을 돈 (미수)</span>
          <span className="num text-xl font-bold text-warning">{formatKRW(s.receivable)}</span>
        </div>

        {/* 마진 비교 */}
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">견적 마진</p>
            <p className={cn("num text-lg font-bold", quoteLoss ? "text-loss" : "text-profit")}>
              {formatKRW(s.quoteMargin)}
            </p>
            <p className="text-[11px] text-muted-foreground">{s.quoteRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">실제 마진</p>
            <p className={cn("num text-lg font-bold", actualLoss ? "text-loss" : "text-profit")}>
              {formatKRW(s.actualMargin)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              견적가 − 실제지출 · {s.actualRate}%
            </p>
          </div>
        </div>

        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 size-3 shrink-0" />
          {FINANCE_DISCLAIMER}
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("num font-semibold", muted && "text-muted-foreground")}>{value}</span>
    </div>
  );
}
