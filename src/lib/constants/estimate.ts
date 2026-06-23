import type { EstimateStatus } from "@/types/database";

export const ESTIMATE_STATUS_ORDER: EstimateStatus[] = ["draft", "sent", "accepted", "rejected"];

export const estimateStatusMeta: Record<EstimateStatus, { label: string; badge: string }> = {
  draft: { label: "작성중", badge: "bg-secondary text-muted-foreground" },
  sent: {
    label: "발송",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  accepted: { label: "수락", badge: "bg-success/15 text-success" },
  rejected: { label: "반려", badge: "bg-loss/15 text-loss" },
};

export function isEstimateStatus(v: string): v is EstimateStatus {
  return v in estimateStatusMeta;
}
