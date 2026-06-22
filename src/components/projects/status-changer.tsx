"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { PROJECT_STATUS_ORDER, projectStatusMeta } from "@/lib/constants/project";
import { updateProjectStatusAction } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import type { ProjectStatus } from "@/types/database";

export function StatusChanger({
  projectId,
  status,
}: {
  projectId: string;
  status: ProjectStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentIndex = PROJECT_STATUS_ORDER.indexOf(status);
  const next = PROJECT_STATUS_ORDER[currentIndex + 1];

  function change(to: ProjectStatus) {
    if (to === status) return;
    startTransition(async () => {
      const res = await updateProjectStatusAction({ id: projectId, status: to });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`상태를 '${projectStatusMeta[to].label}'(으)로 변경했어요.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {/* 단계 스테퍼 — 탭해서 직접 이동 가능 */}
      <div className="flex items-center gap-1">
        {PROJECT_STATUS_ORDER.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <button
              key={s}
              type="button"
              disabled={isPending}
              onClick={() => change(s)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-secondary",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-[11px]",
                  active
                    ? "border-primary-foreground bg-primary-foreground/20"
                    : done
                      ? "border-success bg-success text-success-foreground"
                      : "border-border",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              {projectStatusMeta[s].label}
            </button>
          );
        })}
      </div>

      {/* 다음 단계로 이동 (선형 흐름) */}
      {next ? (
        <Button
          type="button"
          variant="accent"
          size="touch"
          className="w-full"
          disabled={isPending}
          onClick={() => change(next)}
        >
          {isPending ? "변경 중…" : `'${projectStatusMeta[next].label}' 단계로 이동`}
          <ChevronRight className="size-4" />
        </Button>
      ) : (
        <p className="rounded-lg bg-success/10 py-2.5 text-center text-sm font-medium text-success">
          완료된 현장입니다 ✓
        </p>
      )}
    </div>
  );
}
