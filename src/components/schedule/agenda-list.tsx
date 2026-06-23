"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MapPin } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { toggleTaskAction } from "@/lib/actions/tasks";
import type { AgendaTask } from "@/lib/data/tasks";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

export function AgendaList({ tasks, today }: { tasks: AgendaTask[]; today: string }) {
  const router = useRouter();
  const [items, setItems] = useState(tasks);
  const [, startTransition] = useTransition();

  function complete(id: string) {
    setItems((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => {
      const res = await toggleTaskAction({ id, done: true });
      if (!res.ok) {
        toast.error(res.error);
        router.refresh();
        return;
      }
      toast.success("완료 처리했어요.");
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
        이번 주 예정된 공정이 없어요. 현장에서 공정을 추가해보세요.
      </p>
    );
  }

  const overdue = items.filter((t) => t.due_on && t.due_on < today);
  const todayList = items.filter((t) => t.due_on === today);
  const week = items.filter((t) => t.due_on && t.due_on > today);

  return (
    <div className="space-y-4">
      <Group label="지연" tone="loss" tasks={overdue} onComplete={complete} />
      <Group label="오늘" tone="accent" tasks={todayList} onComplete={complete} />
      <Group label="이번 주" tone="muted" tasks={week} onComplete={complete} />
    </div>
  );
}

function Group({
  label,
  tone,
  tasks,
  onComplete,
}: {
  label: string;
  tone: "loss" | "accent" | "muted";
  tasks: AgendaTask[];
  onComplete: (id: string) => void;
}) {
  if (tasks.length === 0) return null;
  const dot =
    tone === "loss" ? "bg-loss" : tone === "accent" ? "bg-warning" : "bg-muted-foreground";
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", dot)} />
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="num text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <button
              type="button"
              aria-label="완료"
              onClick={() => onComplete(t.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-border text-transparent transition-colors hover:border-success hover:text-success"
            >
              <Check className="size-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.name}</p>
              <Link
                href={`/sites/${t.project_id}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <MapPin className="size-3" /> {t.project_name ?? "현장"}
              </Link>
            </div>
            {t.due_on ? (
              <span className="shrink-0 text-xs text-muted-foreground">{fmt(t.due_on)}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
