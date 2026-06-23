import { cn } from "@/lib/utils";
import { estimateStatusMeta } from "@/lib/constants/estimate";
import type { EstimateStatus } from "@/types/database";

export function EstimateStatusBadge({
  status,
  className,
}: {
  status: EstimateStatus;
  className?: string;
}) {
  const meta = estimateStatusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        meta.badge,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
