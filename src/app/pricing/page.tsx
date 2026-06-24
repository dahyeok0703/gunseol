import type { Metadata } from "next";
import Link from "next/link";
import { HardHat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PlanComparison } from "@/components/billing/plan-comparison";

export const metadata: Metadata = { title: "요금제" };

export default function PricingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-safe pt-safe">
      <header className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HardHat className="size-4.5" />
          </span>
          <span className="font-bold">건설</span>
        </Link>
        <Button asChild size="sm" variant="ghost">
          <Link href="/login">로그인</Link>
        </Button>
      </header>

      <div className="flex-1 space-y-6 py-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">요금제</h1>
          <p className="text-sm text-muted-foreground">현장에서 폰으로, 견적부터 수금까지.</p>
        </div>

        <PlanComparison />

        <Button asChild variant="accent" size="touch" className="w-full">
          <Link href="/billing">Pro 시작하기</Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          가입 후 언제든지 업그레이드·해지할 수 있어요.
        </p>
      </div>
    </div>
  );
}
