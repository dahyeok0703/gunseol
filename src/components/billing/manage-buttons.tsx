"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelSubscriptionAction, resumeSubscriptionAction } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";

/**
 * Pro 구독 관리 — 해지 예약 / 재개.
 * cancelAtPeriodEnd 상태에 따라 버튼이 바뀐다.
 */
export function ManageButtons({ cancelAtPeriodEnd }: { cancelAtPeriodEnd: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function cancel() {
    startTransition(async () => {
      const res = await cancelSubscriptionAction({});
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("기간 만료 시 해지되도록 예약했어요.");
      router.refresh();
    });
  }

  function resume() {
    startTransition(async () => {
      const res = await resumeSubscriptionAction({});
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("구독을 재개했어요.");
      router.refresh();
    });
  }

  if (cancelAtPeriodEnd) {
    return (
      <Button
        type="button"
        variant="accent"
        size="touch"
        className="w-full"
        disabled={pending}
        onClick={resume}
      >
        {pending ? "처리 중…" : "구독 재개"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="touch"
      className="w-full"
      disabled={pending}
      onClick={cancel}
    >
      {pending ? "처리 중…" : "구독 해지"}
    </Button>
  );
}
