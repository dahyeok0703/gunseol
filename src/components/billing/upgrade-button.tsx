"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { subscribeAction } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";

const SDK_SRC = "https://cdn.portone.io/v2/browser-sdk.js";

// PortOne 브라우저 SDK 타입(필요 최소)
interface PortOneSdk {
  requestIssueBillingKey: (req: Record<string, unknown>) => Promise<{
    code?: string;
    message?: string;
    billingKey?: string;
    card?: { name?: string; number?: string };
  }>;
}

function loadPortOne(): Promise<PortOneSdk> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { PortOne?: PortOneSdk };
    if (w.PortOne) return resolve(w.PortOne);
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.onload = () => (w.PortOne ? resolve(w.PortOne) : reject(new Error("SDK 로드 실패")));
    script.onerror = () => reject(new Error("SDK 로드 실패"));
    document.head.appendChild(script);
  });
}

/**
 * Pro 업그레이드 — PortOne 빌링키 발급(카드 등록) → 첫 결제(subscribeAction).
 * 결제 키가 없으면 '준비중'으로 비활성화된다.
 */
export function UpgradeButton({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
  const ready = enabled && Boolean(storeId && channelKey);

  async function upgrade() {
    if (!ready) return;
    setBusy(true);
    try {
      const PortOne = await loadPortOne();
      const customerKey = `cust_${crypto.randomUUID()}`;
      const res = await PortOne.requestIssueBillingKey({
        storeId,
        channelKey,
        billingKeyMethod: "CARD",
        issueId: `issue_${Date.now()}`,
        issueName: "건설 Pro 구독",
        customer: { customerId: customerKey },
      });

      if (res.code || !res.billingKey) {
        toast.error(res.message ?? "카드 등록이 취소되었어요.");
        return;
      }

      startTransition(async () => {
        const sub = await subscribeAction({
          billing_key: res.billingKey!,
          customer_key: customerKey,
          card_brand: res.card?.name ?? "",
          card_last4: res.card?.number?.slice(-4) ?? "",
        });
        if (!sub.ok) {
          toast.error(sub.error);
          return;
        }
        toast.success("Pro 로 업그레이드되었어요!");
        router.refresh();
      });
    } catch {
      toast.error("결제 처리 중 문제가 발생했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <Button type="button" variant="outline" size="touch" className="w-full" disabled>
        결제 준비 중
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="accent"
      size="touch"
      className="w-full"
      disabled={busy}
      onClick={upgrade}
    >
      <Sparkles className="size-4" /> {busy ? "처리 중…" : "Pro 로 업그레이드"}
    </Button>
  );
}
