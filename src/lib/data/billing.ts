import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type SubscriptionView = Pick<
  Database["public"]["Tables"]["subscriptions"]["Row"],
  "status" | "card_brand" | "card_last4" | "current_period_end" | "cancel_at_period_end" | "last_payment_at"
>;
export type BillingPayment = Database["public"]["Tables"]["billing_payments"]["Row"];

/** 구독 현황(안전 컬럼만 — billing_key 등 민감값 제외). owner 만 RLS 로 조회. */
export async function getSubscription(workspaceId: string): Promise<SubscriptionView | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("status, card_brand, card_last4, current_period_end, cancel_at_period_end, last_payment_at")
    .eq("workspace_id", workspaceId)
    .returns<SubscriptionView[]>()
    .maybeSingle();
  return data ?? null;
}

export async function getBillingHistory(workspaceId: string): Promise<BillingPayment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("billing_payments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(24)
    .returns<BillingPayment[]>();
  return data ?? [];
}
