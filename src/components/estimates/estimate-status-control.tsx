"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { ESTIMATE_STATUS_ORDER, estimateStatusMeta } from "@/lib/constants/estimate";
import { updateEstimateStatusAction } from "@/lib/actions/estimates";
import type { EstimateStatus } from "@/types/database";

export function EstimateStatusControl({
  id,
  status,
}: {
  id: string;
  status: EstimateStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function change(to: EstimateStatus) {
    if (to === status) return;
    startTransition(async () => {
      const res = await updateEstimateStatusAction({ id, status: to });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`견적 상태: ${estimateStatusMeta[to].label}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ESTIMATE_STATUS_ORDER.map((s) => {
        const active = s === status;
        return (
          <button
            key={s}
            type="button"
            disabled={isPending}
            onClick={() => change(s)}
            className={cn(
              "tap-target rounded-full border px-4 text-sm font-medium transition-colors disabled:opacity-60",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {estimateStatusMeta[s].label}
          </button>
        );
      })}
    </div>
  );
}
