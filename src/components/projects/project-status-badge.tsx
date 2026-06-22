import { cn } from "@/lib/utils";
import { projectStatusMeta } from "@/lib/constants/project";
import type { ProjectStatus } from "@/types/database";

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const meta = projectStatusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        meta.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
