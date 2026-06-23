import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, TrendingUp, AlertTriangle, Hammer, Info, ChevronRight } from "lucide-react";

import { requireAuth } from "@/lib/auth/context";
import { getAgendaTasks } from "@/lib/data/tasks";
import { getDashboardFinance } from "@/lib/data/finance";
import { formatKRW } from "@/lib/utils";
import { FINANCE_DISCLAIMER } from "@/lib/constants/disclaimer";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app-shell/page-header";
import { AgendaList } from "@/components/schedule/agenda-list";
import { ProfitabilityChart } from "@/components/dashboard/profitability-chart";

export const metadata: Metadata = { title: "대시보드" };

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
const fmtDue = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

export default async function DashboardPage() {
  const ctx = await requireAuth();

  const now = new Date();
  const today = localDate(now);
  const monthStart = localDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = localDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + ((7 - now.getDay()) % 7));

  const [finance, tasks] = await Promise.all([
    getDashboardFinance(ctx.workspaceId, { monthStart, monthEnd, today }),
    getAgendaTasks(ctx.workspaceId, localDate(weekEnd)),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`안녕하세요${ctx.displayName ? `, ${ctx.displayName}님` : ""}`}
        description="지금 받을 돈과 현장 수익성을 한눈에."
      />

      {/* 지금 받을 돈 */}
      <Card>
        <CardContent className="space-y-1 p-5">
          <p className="text-sm text-muted-foreground">이번 달 받을 돈</p>
          <p className="num text-4xl font-bold text-warning">
            {formatKRW(finance.receivableThisMonth)}
          </p>
          <p className="text-xs text-muted-foreground">
            전체 미수 {formatKRW(finance.totalReceivable)}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="size-3.5" /> 연체
            </p>
            <p className="num text-xl font-bold text-loss">{formatKRW(finance.overdueAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Hammer className="size-3.5" /> 진행 현장
            </p>
            <p className="num text-xl font-bold">{finance.inProgressCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* 받을 돈 임박 Top */}
      {finance.upcoming.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">받을 돈 임박</h2>
          <ul className="space-y-2">
            {finance.upcoming.map((u) => (
              <li key={u.id}>
                <Link href={u.project_id ? `/sites/${u.project_id}` : "/sites"} className="block">
                  <Card className="flex items-center gap-3 p-3 transition-colors active:bg-secondary/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {u.label}
                        {u.overdue ? (
                          <span className="ml-1.5 text-xs font-semibold text-loss">연체</span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.project_name ?? "현장"}
                        {u.due_on ? ` · ${fmtDue(u.due_on)}` : ""}
                      </p>
                    </div>
                    <span className="num shrink-0 font-bold text-warning">
                      {formatKRW(u.amount)}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 현장 수익성: 견적 마진 vs 실제 마진 */}
      {finance.profitability.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-profit" />
            <h2 className="text-sm font-semibold">현장 수익성 (견적 마진 vs 실제 마진)</h2>
          </div>
          <Card>
            <CardContent className="p-3 pt-4">
              <ProfitabilityChart data={finance.profitability} />
            </CardContent>
          </Card>
        </section>
      ) : null}

      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 size-3 shrink-0" />
        {FINANCE_DISCLAIMER}
      </p>

      {/* 오늘·이번 주 할 공정 */}
      <section className="space-y-3 border-t border-border pt-5">
        <div className="flex items-center gap-2">
          <CalendarCheck className="size-5 text-warning" />
          <h2 className="font-semibold">할 공정</h2>
        </div>
        <AgendaList tasks={tasks} today={today} />
      </section>
    </div>
  );
}
