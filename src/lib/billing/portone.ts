import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  BillingAdapter,
  ChargeArgs,
  ChargeResult,
  PaymentDetail,
  WebhookEvent,
} from "@/lib/billing/types";

/**
 * PortOne(포트원) v2 결제 어댑터.
 * - 정기결제: 빌링키 결제 REST 호출
 * - 웹훅: Standard Webhooks 서명 검증
 *
 * 빌링키 발급은 브라우저 SDK(클라이언트)에서 수행하고, 서버는 받은 빌링키로 결제한다.
 */
const API_BASE = "https://api.portone.io";

export function createPortOneAdapter(opts: {
  apiSecret: string;
  webhookSecret?: string;
}): BillingAdapter {
  const auth = `PortOne ${opts.apiSecret}`;

  return {
    provider: "portone",

    async charge(args: ChargeArgs): Promise<ChargeResult> {
      const res = await fetch(
        `${API_BASE}/payments/${encodeURIComponent(args.paymentId)}/billing-key`,
        {
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify({
            billingKey: args.billingKey,
            orderName: args.orderName,
            customer: { id: args.customerKey },
            amount: { total: args.amountKrw },
            currency: "KRW",
          }),
        },
      );
      const raw = await res.json().catch(() => ({}));
      const status =
        (raw as { payment?: { status?: string } })?.payment?.status ?? (res.ok ? "PAID" : "FAILED");
      return { ok: res.ok, paymentId: args.paymentId, status: String(status), raw };
    },

    async getPayment(paymentId: string): Promise<PaymentDetail> {
      const res = await fetch(`${API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: auth },
      });
      const raw = (await res.json().catch(() => ({}))) as {
        status?: string;
        amount?: { total?: number };
        customData?: string;
      };
      let customData: Record<string, unknown> = {};
      if (raw.customData) {
        try {
          customData = JSON.parse(raw.customData);
        } catch {
          /* ignore */
        }
      }
      return {
        status: String(raw.status ?? "UNKNOWN"),
        amount: Number(raw.amount?.total ?? 0),
        customData,
        raw,
      };
    },

    async verifyWebhook(rawBody, headers): Promise<WebhookEvent> {
      const id = headers["webhook-id"];
      const timestamp = headers["webhook-timestamp"];
      const signature = headers["webhook-signature"];
      if (!id || !timestamp || !signature) throw new Error("웹훅 헤더 누락");
      if (!opts.webhookSecret) throw new Error("PORTONE_WEBHOOK_SECRET 미설정");

      // Standard Webhooks: base64(hmacSHA256(secret, `${id}.${ts}.${body}`))
      const secret = opts.webhookSecret.startsWith("whsec_")
        ? opts.webhookSecret.slice("whsec_".length)
        : opts.webhookSecret;
      const key = Buffer.from(secret, "base64");
      const signedContent = `${id}.${timestamp}.${rawBody}`;
      const expected = createHmac("sha256", key).update(signedContent).digest("base64");

      const provided = signature
        .split(" ")
        .map((part) => (part.includes(",") ? (part.split(",")[1] ?? "") : part));
      const ok = provided.some((sig) => {
        try {
          const a = Buffer.from(sig);
          const b = Buffer.from(expected);
          return a.length === b.length && timingSafeEqual(a, b);
        } catch {
          return false;
        }
      });
      if (!ok) throw new Error("웹훅 서명 불일치");

      const parsed = JSON.parse(rawBody) as {
        type?: string;
        data?: { paymentId?: string; transactionId?: string };
      };
      return {
        id,
        type: String(parsed.type ?? "unknown"),
        paymentId: parsed.data?.paymentId ?? parsed.data?.transactionId ?? null,
        raw: parsed,
      };
    },
  };
}
