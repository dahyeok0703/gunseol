import { type NextRequest } from "next/server";
import { getBillingAdapter } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function addMonthIso(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * PortOne 웹훅. 서명 검증 + 멱등(event_id) + billing_events 로깅 후
 * 정기결제 성공/실패에 따라 구독·plan·이력을 갱신한다.
 */
export async function POST(request: NextRequest) {
  const adapter = getBillingAdapter();
  if (!adapter) return new Response("billing disabled", { status: 503 });

  const rawBody = await request.text();
  const headers: Record<string, string | undefined> = {
    "webhook-id": request.headers.get("webhook-id") ?? undefined,
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? undefined,
    "webhook-signature": request.headers.get("webhook-signature") ?? undefined,
  };

  let event;
  try {
    event = await adapter.verifyWebhook(rawBody, headers);
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  const admin = createAdminClient();

  // 멱등: event_id 중복이면 이미 처리됨 (unique index)
  const { error: insErr } = await admin
    .from("billing_events")
    .insert({ event_id: event.id, type: event.type, raw: event.raw as never });
  if (insErr) {
    if ((insErr as { code?: string }).code === "23505") {
      return new Response("ok (duplicate)", { status: 200 });
    }
    return new Response("log error", { status: 500 });
  }

  if (event.paymentId) {
    try {
      const detail = await adapter.getPayment(event.paymentId);
      const workspaceId = String(detail.customData.workspace_id ?? "");
      if (workspaceId) {
        await admin
          .from("billing_events")
          .update({ workspace_id: workspaceId })
          .eq("event_id", event.id);

        const paid = /paid/i.test(detail.status) || /paid/i.test(event.type);
        const failed = /fail/i.test(detail.status) || /fail/i.test(event.type);

        // 결제 이력 중복 방지
        const { data: existing } = await admin
          .from("billing_payments")
          .select("id")
          .eq("provider_payment_id", event.paymentId)
          .maybeSingle();

        if (paid) {
          await admin
            .from("subscriptions")
            .update({
              status: "active",
              current_period_end: addMonthIso(1),
              last_payment_at: new Date().toISOString(),
            })
            .eq("workspace_id", workspaceId);
          await admin.from("workspaces").update({ plan: "pro" }).eq("id", workspaceId);
          if (!existing) {
            await admin.from("billing_payments").insert({
              workspace_id: workspaceId,
              provider_payment_id: event.paymentId,
              amount: detail.amount,
              status: "paid",
              paid_at: new Date().toISOString(),
              raw: detail.raw as never,
            });
          }
        } else if (failed) {
          await admin
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("workspace_id", workspaceId);
          if (!existing) {
            await admin.from("billing_payments").insert({
              workspace_id: workspaceId,
              provider_payment_id: event.paymentId,
              amount: detail.amount,
              status: "failed",
              raw: detail.raw as never,
            });
          }
        }
      }
    } catch {
      // 상세 조회/갱신 실패해도 이벤트는 기록됨 — 200 으로 재전송 방지
    }
  }

  return new Response("ok", { status: 200 });
}
