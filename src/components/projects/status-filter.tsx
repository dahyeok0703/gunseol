"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_ORDER, projectStatusMeta } from "@/lib/constants/project";

/** 현장 상태 필터 — 가로 스크롤 칩. URL ?status= 로 반영 */
export function StatusFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("status") ?? "all";

  function select(value: string) {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (value === "all") next.delete("status");
    else next.set("status", value);
    router.replace(`/sites?${next.toString()}` as Route);
  }

  const chips = [{ key: "all", label: "전체" }].concat(
    PROJECT_STATUS_ORDER.map((s) => ({ key: s, label: projectStatusMeta[s].label })),
  );

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => select(c.key)}
          className={cn(
            "tap-target whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
            active === c.key
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
