import { type NextRequest, NextResponse } from "next/server";

import { features } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 연체 수금 알림 크론.
 *
 * Vercel Cron 이 매일 1회 호출(`vercel.json`)한다. `Authorization: Bearer <CRON_SECRET>`
 * 헤더로 인증한다. 서비스 역할(admin) 클라이언트로 전 워크스페이스의 연체(pending +
 * due_on < 오늘) 수금을 집계한다.
 *
 * ⚠️ 현재는 집계 + 로깅까지만 수행한다(이메일/푸시 발송 채널 미연동). 알림 발송이
 *    필요하면 아래 집계 결과를 메일/푸시 어댑터에 연결하면 된다.
 * - CRON_SECRET / 서비스 롤 키가 없으면 503 으로 우아하게 비활성된다.
 */
export async function GET(request: NextRequest) {
  if (!features.cron) {
    return NextResponse.json({ ok: false, reason: "cron-disabled" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("payments")
    .select("workspace_id, amount, due_on")
    .eq("status", "pending")
    .lt("due_on", today)
    .returns<{ workspace_id: string; amount: number; due_on: string }[]>();

  if (error) {
    console.error("[cron/overdue] 조회 실패:", error.message);
    return NextResponse.json({ ok: false, reason: "query-failed" }, { status: 500 });
  }

  // 워크스페이스별 연체 집계
  const byWorkspace = new Map<string, { count: number; amount: number }>();
  for (const p of data ?? []) {
    const acc = byWorkspace.get(p.workspace_id) ?? { count: 0, amount: 0 };
    acc.count += 1;
    acc.amount += p.amount;
    byWorkspace.set(p.workspace_id, acc);
  }

  const summary = {
    ranAt: new Date().toISOString(),
    overdueItems: data?.length ?? 0,
    workspaces: byWorkspace.size,
    totalAmount: Array.from(byWorkspace.values()).reduce((s, w) => s + w.amount, 0),
  };

  // TODO: 메일/푸시 채널 연동 시 byWorkspace 를 순회하며 발송.
  console.info("[cron/overdue]", JSON.stringify(summary));

  return NextResponse.json({ ok: true, ...summary });
}
