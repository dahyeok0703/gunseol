import type { ProjectStatus } from "@/types/database";

/** 현장 상태 흐름: 견적중 → 계약 → 진행중 → 완료 */
export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "estimating",
  "contracted",
  "in_progress",
  "done",
];

export const projectStatusMeta: Record<
  ProjectStatus,
  { label: string; badge: string; dot: string }
> = {
  estimating: {
    label: "견적중",
    badge: "bg-warning/15 text-warning",
    dot: "bg-warning",
  },
  contracted: {
    label: "계약",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "진행중",
    badge: "bg-success/15 text-success",
    dot: "bg-success",
  },
  done: {
    label: "완료",
    badge: "bg-secondary text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export function isProjectStatus(value: string): value is ProjectStatus {
  return value in projectStatusMeta;
}
