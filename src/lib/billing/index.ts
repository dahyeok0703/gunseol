import "server-only";
import type { BillingAdapter } from "@/lib/billing/types";
import { createPortOneAdapter } from "@/lib/billing/portone";

/**
 * 활성 결제 어댑터를 반환한다. PortOne 시크릿이 없으면 null (결제 '준비중').
 * 공급자 교체는 여기서만 바꾸면 된다.
 */
export function getBillingAdapter(): BillingAdapter | null {
  const apiSecret = process.env.PORTONE_API_SECRET;
  if (!apiSecret) return null;
  return createPortOneAdapter({
    apiSecret,
    webhookSecret: process.env.PORTONE_WEBHOOK_SECRET,
  });
}

export type { BillingAdapter } from "@/lib/billing/types";
