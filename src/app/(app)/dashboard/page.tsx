import type { Metadata } from "next";
import { Hammer, TrendingUp, Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";
import { formatKRW } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/app-shell/empty-state";

export const metadata: Metadata = { title: "대시보드" };

// 골격 단계: 실제 집계는 추후 연결. 지금은 0 으로 표시.
const summary = { quoteTotal: 0, costTotal: 0, margin: 0, marginRate: 0 };

export default async function DashboardPage() {
  const ctx = await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`안녕하세요${ctx.displayName ? `, ${ctx.displayName}님` : ""}`}
        description="이번 달 현황을 한눈에 확인하세요."
      />

      {/* 큼직한 마진 카드 — 가장 중요한 숫자 */}
      <Card className="overflow-hidden">
        <CardContent className="space-y-1 p-5">
          <p className="text-sm text-muted-foreground">이번 달 예상 마진</p>
          <p className="num text-4xl font-bold text-profit">{formatKRW(summary.margin)}</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="size-4" />
            마진율 {summary.marginRate}%
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-muted-foreground">견적가 합계</p>
            <p className="num text-xl font-bold">{formatKRW(summary.quoteTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-muted-foreground">실행가 합계</p>
            <p className="num text-xl font-bold">{formatKRW(summary.costTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">진행 중인 현장</h2>
          <Button size="sm" variant="ghost" disabled>
            <Plus className="size-4" /> 추가
          </Button>
        </div>
        <EmptyState
          icon={Hammer}
          title="아직 등록된 현장이 없어요"
          description="현장을 추가하면 진행 상황과 마진을 여기서 바로 볼 수 있어요."
        />
      </section>
    </div>
  );
}
