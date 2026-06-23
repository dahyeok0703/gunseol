import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Hammer, CalendarCheck } from "lucide-react";

import { requireAuth } from "@/lib/auth/context";
import { getAgendaTasks } from "@/lib/data/tasks";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app-shell/page-header";
import { AgendaList } from "@/components/schedule/agenda-list";

export const metadata: Metadata = { title: "대시보드" };

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const ctx = await requireAuth();

  // 이번 주 일요일까지 (지연분 포함)
  const now = new Date();
  const today = localDate(now);
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + ((7 - now.getDay()) % 7));
  const tasks = await getAgendaTasks(ctx.workspaceId, localDate(weekEnd));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`안녕하세요${ctx.displayName ? `, ${ctx.displayName}님` : ""}`}
        description="오늘·이번 주 할 공정을 한눈에."
      />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="size-5 text-warning" />
          <h2 className="font-semibold">할 공정</h2>
        </div>
        <AgendaList tasks={tasks} today={today} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" size="touch" className="justify-start">
          <Link href="/sites">
            <Hammer className="size-4" /> 현장
          </Link>
        </Button>
        <Button asChild variant="outline" size="touch" className="justify-start">
          <Link href="/estimates">
            <FileText className="size-4" /> 견적
          </Link>
        </Button>
      </section>
    </div>
  );
}
