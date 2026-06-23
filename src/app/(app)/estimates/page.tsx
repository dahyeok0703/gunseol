import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";

import { requireAuth } from "@/lib/auth/context";
import { listWorkspaceEstimates } from "@/lib/data/estimates";
import { calcMargin, formatKRW } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/app-shell/empty-state";
import { EstimateStatusBadge } from "@/components/estimates/estimate-status-badge";

export const metadata: Metadata = { title: "견적" };

export default async function EstimatesPage() {
  const ctx = await requireAuth();
  const estimates = await listWorkspaceEstimates(ctx.workspaceId);

  return (
    <div className="space-y-4">
      <PageHeader title="견적" description="현장별 견적과 마진을 한눈에." />

      {estimates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="아직 견적이 없어요"
          description="현장에 들어가 '새 견적'으로 작성하면 여기에 모입니다."
        />
      ) : (
        <ul className="space-y-2">
          {estimates.map((e) => {
            const { margin, rate } = calcMargin(e.total_price, e.total_cost);
            const loss = margin < 0;
            return (
              <li key={e.id}>
                <Link
                  href={
                    e.project_id ? `/sites/${e.project_id}/estimates/${e.id}` : "/estimates"
                  }
                  className="block"
                >
                  <Card className="flex items-center gap-3 p-4 transition-colors active:bg-secondary/50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{e.project_name ?? "현장 미지정"}</p>
                        <span className="num shrink-0 text-xs text-muted-foreground">
                          v{e.version}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <EstimateStatusBadge status={e.status} />
                        <span className="num text-xs text-muted-foreground">
                          견적 {formatKRW(e.total_price)}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`num text-sm font-bold ${loss ? "text-loss" : "text-profit"}`}>
                        {formatKRW(margin)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">마진 {rate}%</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
