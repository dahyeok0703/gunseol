"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/context";
import { action, ActionError } from "@/lib/actions/safe-action";
import { createAdminClient } from "@/lib/supabase/admin";
import { features } from "@/lib/env";
import { getBillingAdapter } from "@/lib/billing";
import { PRO_PRICE_KRW } from "@/lib/constants/plan";

const subscribeSchema = z.object({
  billing_key: z.string().min(1),
  customer_key: z.string().min(1),
  card_brand: z.string().max(40).optional().default(""),
  card_last4: z.string().max(8).optional().default(""),
});

function addMonthIso(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function ensureBillingOwner() {
  const ctx = await requireAuth();
  if (ctx.role !== "owner") throw new ActionError("대표만 결제를 관리할 수 있습니다.");
  if (!features.billing) throw new ActionError("결제가 준비 중입니다. 잠시 후 다시 시도해주세요.");
  return ctx;
}

/** 빌링키로 첫 결제 → Pro 구독 활성화 */
export const subscribeAction = action(subscribeSchema, async (input) => {
  const ctx = await ensureBillingOwner();
  const adapter = getBillingAdapter();
  if (!adapter) throw new ActionError("결제가 준비 중입니다.");

  const paymentId = `sub_${ctx.workspaceId}_${Date.now()}`;
  const charge = await adapter.charge({
    billingKey: input.billing_key,
    customerKey: input.customer_key,
    amountKrw: PRO_PRICE_KRW,
    orderName: "건설 Pro 월 구독",
    paymentId,
  });
  if (!charge.ok || !/paid/i.test(charge.status)) {
    throw new ActionError("결제에 실패했습니다. 카드 정보를 확인해주세요.");
  }

  const admin = createAdminClient();
  const periodEnd = addMonthIso(1);

  const { error: subErr } = await admin.from("subscriptions").upsert(
    {
      workspace_id: ctx.workspaceId,
      status: "active",
      billing_key: input.billing_key,
      customer_key: input.customer_key,
      card_brand: input.card_brand || null,
      card_last4: input.card_last4 || null,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      last_payment_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id" },
  );
  if (subErr) throw new ActionError("구독 저장에 실패했습니다.");

  await admin.from("workspaces").update({ plan: "pro" }).eq("id", ctx.workspaceId);
  await admin.from("billing_payments").insert({
    workspace_id: ctx.workspaceId,
    provider_payment_id: paymentId,
    amount: PRO_PRICE_KRW,
    status: "paid",
    paid_at: new Date().toISOString(),
    raw: charge.raw as never,
  });

  revalidatePath("/billing");
  revalidatePath("/settings");
  return { ok: true, periodEnd };
});

/** 구독 취소 (기간 만료 시 해지 예약) */
export const cancelSubscriptionAction = action(z.object({}), async () => {
  const ctx = await ensureBillingOwner();
  const admin = createAdminClient();
  const { error } = await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("workspace_id", ctx.workspaceId);
  if (error) throw new ActionError("취소 처리에 실패했습니다.");
  revalidatePath("/billing");
  return { ok: true };
});

/** 취소 예약 철회(재개) */
export const resumeSubscriptionAction = action(z.object({}), async () => {
  const ctx = await ensureBillingOwner();
  const admin = createAdminClient();
  const { error } = await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: false })
    .eq("workspace_id", ctx.workspaceId);
  if (error) throw new ActionError("재개 처리에 실패했습니다.");
  revalidatePath("/billing");
  return { ok: true };
});
