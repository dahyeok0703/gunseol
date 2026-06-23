import type { Metadata } from "next";
import { Building2, UserRound, Sparkles, LogOut } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { features } from "@/lib/env";
import { signOutAction } from "@/lib/actions/auth";
import { formatKRW } from "@/lib/utils";
import { FREE_MONTHLY_EXTRACTIONS } from "@/lib/constants/plan";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = { title: "설정" };

export default async function SettingsPage() {
  const ctx = await requireAuth();
  const roleLabel = ctx.role === "owner" ? "대표(owner)" : "직원(staff)";

  // 이번 달 AI 사용량 (owner 만 RLS 로 조회 가능)
  let usage: { doc_count: number; est_cost_krw: number } | null = null;
  if (features.aiExtraction && ctx.role === "owner") {
    const supabase = await createClient();
    const month = new Date();
    const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-01`;
    const { data } = await supabase
      .from("ai_usage")
      .select("doc_count, est_cost_krw")
      .eq("workspace_id", ctx.workspaceId)
      .eq("month", monthStr)
      .returns<{ doc_count: number; est_cost_krw: number }[]>()
      .maybeSingle();
    usage = data ?? { doc_count: 0, est_cost_krw: 0 };
  }

  return (
    <div className="space-y-6">
      <PageHeader title="설정" />

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Building2 className="size-4 text-muted-foreground" /> 업체
          </div>
          <Row label="업체명" value={ctx.workspaceName} />
          <Row label="내 역할" value={roleLabel} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserRound className="size-4 text-muted-foreground" /> 계정
          </div>
          <Row label="이메일" value={ctx.email ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-muted-foreground" /> AI 항목 추출
          </div>
          <p className="text-sm text-muted-foreground">
            {features.aiExtraction
              ? "활성화됨 — 사진·메모에서 견적 항목을 추출해요. (금액 판단에는 사용하지 않아요)"
              : "비활성화됨 — ANTHROPIC_API_KEY 를 설정하면 활성화됩니다."}
          </p>
          <span
            className={
              "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
              (features.aiExtraction
                ? "bg-success/15 text-success"
                : "bg-secondary text-muted-foreground")
            }
          >
            {features.aiExtraction ? "사용 가능" : "키 없음"}
          </span>

          {usage ? (
            <div className="mt-1 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">
                이번 달 추출{" "}
                <span className="num font-semibold text-foreground">{usage.doc_count}</span>회
                <span className="text-muted-foreground">
                  {" "}
                  / {FREE_MONTHLY_EXTRACTIONS}회 (free)
                </span>
              </span>
              <span className="num text-muted-foreground">≈ {formatKRW(usage.est_cost_krw)}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <form action={signOutAction}>
        <Button type="submit" variant="outline" size="lg" className="w-full">
          <LogOut className="size-4" /> 로그아웃
        </Button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
