import type { Metadata } from "next";
import { CreditCard, Sparkles, ShieldCheck, Receipt } from "lucide-react";

import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { features } from "@/lib/env";
import { formatKRW } from "@/lib/utils";
import { PRO_PRICE_KRW, PLAN_LIMITS } from "@/lib/constants/plan";
import { monthlyAiCostCeilingKrw } from "@/lib/pricing/cogs";
import { getWorkspacePlan } from "@/lib/data/workspace";
import { getSubscription, getBillingHistory } from "@/lib/data/billing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app-shell/page-header";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { ManageButtons } from "@/components/billing/manage-buttons";

export const metadata: Metadata = { title: "구독 결제" };

type StatusInfo = { label: string; variant: "success" | "outline" | "accent" };
const STATUS_LABEL: Record<string, StatusInfo> = {
  active: { label: "이용 중", variant: "success" },
  past_due: { label: "결제 실패", variant: "accent" },
  canceled: { label: "해지됨", variant: "outline" },
  inactive: { label: "미사용", variant: "outline" },
};
const STATUS_FALLBACK: StatusInfo = { label: "미사용", variant: "outline" };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function BillingPage() {
  const ctx = await requireAuth();

  if (ctx.role !== "owner") {
    return (
      <div className="space-y-6">
        <PageHeader title="구독 결제" />
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            구독·결제는 대표(owner)만 관리할 수 있어요.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [plan, subscription, history] = await Promise.all([
    getWorkspacePlan(ctx.workspaceId),
    getSubscription(ctx.workspaceId),
    getBillingHistory(ctx.workspaceId),
  ]);

  // 이번 달 실제 AI 원가 (마진 점검 — ai_usage 연동)
  let aiCostThisMonth = 0;
  if (features.aiExtraction) {
    const supabase = await createClient();
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { data } = await supabase
      .from("ai_usage")
      .select("est_cost_krw")
      .eq("workspace_id", ctx.workspaceId)
      .eq("month", monthStr)
      .returns<{ est_cost_krw: number }[]>()
      .maybeSingle();
    aiCostThisMonth = data?.est_cost_krw ?? 0;
  }

  const isPro = plan === "pro";
  const status = subscription?.status ?? "inactive";
  const statusInfo = STATUS_LABEL[status] ?? STATUS_FALLBACK;
  const cancelScheduled = Boolean(subscription?.cancel_at_period_end);

  // plan 별 마진 점검: 가격(설정값) − AI 원가 상한(쿼터 × 추출 1회 원가)
  const proQuota = PLAN_LIMITS.pro.aiExtractions;
  const aiCeiling = monthlyAiCostCeilingKrw(proQuota);
  const grossMargin = PRO_PRICE_KRW - aiCeiling;

  return (
    <div className="space-y-6">
      <PageHeader title="구독 결제" description="현장에서 폰으로, 견적부터 수금까지." />

      {/* 현재 플랜 */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="size-4 text-muted-foreground" /> 현재 플랜
            </div>
            <Badge variant={isPro ? "accent" : "outline"}>{isPro ? "Pro" : "Free"}</Badge>
          </div>

          {isPro && subscription ? (
            <div className="space-y-2 border-t border-border pt-3 text-sm">
              <Row label="상태" value={<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>} />
              <Row
                label="결제 수단"
                value={
                  subscription.card_brand || subscription.card_last4
                    ? `${subscription.card_brand ?? "카드"} ···· ${subscription.card_last4 ?? "----"}`
                    : "—"
                }
              />
              <Row label="다음 결제일" value={formatDate(subscription.current_period_end)} />
              {cancelScheduled ? (
                <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  {formatDate(subscription.current_period_end)} 에 해지될 예정이에요. 그 전까지는 Pro
                  기능을 계속 쓸 수 있어요.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="border-t border-border pt-3 text-sm text-muted-foreground">
              현재 무료 플랜이에요. Pro 로 업그레이드하면 현장 무제한·출력물 워터마크 제거·넉넉한 AI
              추출을 쓸 수 있어요.
            </p>
          )}

          <div className="pt-1">
            {isPro && subscription && status === "active" ? (
              <ManageButtons cancelAtPeriodEnd={cancelScheduled} />
            ) : (
              <UpgradeButton enabled={features.billing} />
            )}
          </div>

          {!features.billing ? (
            <p className="text-center text-xs text-muted-foreground">
              결제가 준비 중이에요. (PORTONE 키 설정 시 활성화)
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* 플랜 비교 */}
      <PlanComparison currentPlan={plan} />

      {/* 마진 점검 (ai_usage · cogs 연동) */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-muted-foreground" /> Pro 단가·AI 원가 점검
          </div>
          <p className="text-xs text-muted-foreground">
            Pro 가격(설정값)이 AI 추출 원가를 감당하는지 점검해요. 원가는 모델 토큰 단가·환율 기준
            추정치입니다.
          </p>
          <div className="space-y-2 border-t border-border pt-3 text-sm">
            <Row label="Pro 월 구독료" value={<span className="num">{formatKRW(PRO_PRICE_KRW)}</span>} />
            <Row
              label={`AI 원가 상한 (쿼터 ${proQuota.toLocaleString("ko-KR")}회)`}
              value={<span className="num">≈ {formatKRW(aiCeiling)}</span>}
            />
            <Row
              label="추정 마진"
              value={
                <span className={`num font-semibold ${grossMargin >= 0 ? "text-profit" : "text-loss"}`}>
                  {grossMargin >= 0 ? "" : "−"}
                  {formatKRW(Math.abs(grossMargin))}
                </span>
              }
            />
            <Row
              label="이번 달 실제 AI 원가"
              value={<span className="num text-muted-foreground">≈ {formatKRW(aiCostThisMonth)}</span>}
            />
          </div>
        </CardContent>
      </Card>

      {/* 결제 내역 */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Receipt className="size-4 text-muted-foreground" /> 결제 내역
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 결제 내역이 없어요.</p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{formatDate(p.paid_at ?? p.created_at)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.status === "paid" ? "결제 완료" : p.status === "failed" ? "결제 실패" : p.status}
                    </p>
                  </div>
                  <span className="num font-medium">{formatKRW(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="flex items-start gap-1.5 px-1 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        표시 금액·마진은 입력값과 추정 단가 기반 참고치이며, 회계·세무 신고를 대체하지 않습니다.
        결제는 PortOne(포트원)을 통해 안전하게 처리돼요.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
