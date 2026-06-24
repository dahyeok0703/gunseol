import type { Metadata } from "next";
import Link from "next/link";
import {
  HardHat,
  Sparkles,
  TrendingUp,
  Wallet,
  FileText,
  CalendarCheck,
  ArrowRight,
  Check,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { LandingFooter } from "@/components/marketing/landing-footer";

export const metadata: Metadata = {
  title: "건설 — 현장에서 폰으로, 견적부터 수금까지",
  description:
    "1인·소규모 인테리어 업자를 위한 모바일 우선 견적·현장관리 도구. 현장에서 폰으로 5분 만에 견적을 만들고, 견적가/실행가로 마진을, 받을 돈까지 한눈에.",
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI 항목 추출",
    desc: "사진·손메모·카톡 견적 요청을 찍으면 견적 항목으로 자동 정리. 금액은 항상 사장님이 직접 확정합니다.",
  },
  {
    icon: TrendingUp,
    title: "견적가 / 실행가 마진",
    desc: "라인마다 견적가와 실행가를 따로 적으면 현장 마진이 즉시 큼직한 숫자로. 남는 장사인지 바로 보입니다.",
  },
  {
    icon: Wallet,
    title: "받을 돈",
    desc: "계약금·중도금·잔금 수금을 관리하고, 미수금·연체·입금 임박을 한눈에. 지금 받을 돈이 대시보드 맨 위에.",
  },
  {
    icon: FileText,
    title: "출력물 PDF",
    desc: "견적서·계약서·거래명세서를 폰에서 바로 생성해 공유. 업체 로고·도장까지 넣어 깔끔하게.",
  },
  {
    icon: CalendarCheck,
    title: "현장 일정",
    desc: "공정 체크리스트를 드래그로 정렬하고 진행률을 확인. 오늘·이번 주 할 공정을 여러 현장에서 모아봅니다.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ctaHref = user ? "/dashboard" : "/signup";
  const ctaLabel = user ? "대시보드로 가기" : "무료로 시작하기";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-safe pt-safe">
      {/* 상단 바 */}
      <header className="flex items-center justify-between py-4">
        <span className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HardHat className="size-4.5" />
          </span>
          <span className="font-bold">건설</span>
        </span>
        <Button asChild size="sm" variant="ghost">
          <Link href={user ? "/dashboard" : "/login"}>{user ? "대시보드" : "로그인"}</Link>
        </Button>
      </header>

      {/* 히어로 */}
      <section className="space-y-5 py-8 text-center">
        <span className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-warning">
          <Sparkles className="size-3.5" /> 1인·소규모 인테리어 업자 전용
        </span>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          현장에서 폰으로
          <br />
          <span className="text-accent-foreground">5분 만에 견적</span>,<br />
          마진까지 한눈에
        </h1>
        <p className="text-balance text-muted-foreground">
          견적·현장 진행·받을 돈을 폰 하나로. 복잡한 설치 없이, 가입하면 바로 현장에서 씁니다.
        </p>
        <div className="space-y-2 pt-2">
          <Button asChild variant="accent" size="touch" className="w-full">
            <Link href={ctaHref}>
              {ctaLabel} <ArrowRight className="size-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">신용카드 없이 무료로 시작 · 언제든 해지</p>
        </div>
      </section>

      {/* 기능 */}
      <section className="space-y-3 py-8">
        <h2 className="text-center text-xl font-bold">현장에 필요한 것만</h2>
        <ul className="space-y-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <f.icon className="size-4.5" />
                </span>
                <h3 className="font-semibold">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 가격 */}
      <section className="space-y-4 py-8">
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-bold">간단한 요금제</h2>
          <p className="text-sm text-muted-foreground">무료로 충분히 써보고, 필요할 때 Pro 로.</p>
        </div>
        <PlanComparison />
        <Button asChild variant="outline" size="touch" className="w-full">
          <Link href="/pricing">요금제 자세히 보기</Link>
        </Button>
      </section>

      {/* 마지막 CTA */}
      <section className="space-y-4 rounded-2xl bg-primary p-6 text-center text-primary-foreground">
        <h2 className="text-xl font-bold">오늘 현장부터 바로 쓰세요</h2>
        <ul className="space-y-1.5 text-left text-sm">
          {["가입 즉시 사용 — 설치·설정 없음", "현장에서 폰으로 견적·수금", "마진은 늘 사장님이 확정"].map(
            (t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-accent" /> {t}
              </li>
            ),
          )}
        </ul>
        <Button asChild variant="accent" size="touch" className="w-full">
          <Link href={ctaHref}>
            {ctaLabel} <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      <LandingFooter />
    </div>
  );
}
