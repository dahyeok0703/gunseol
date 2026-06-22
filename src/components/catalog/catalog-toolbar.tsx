"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Search, X, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/** 단가표 검색 + 카테고리 필터 + 즐겨찾기 토글 (URL 동기화) */
export function CatalogToolbar({ categories }: { categories: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const cat = params.get("cat") ?? "";
  const fav = params.get("fav") === "1";

  function push(next: URLSearchParams) {
    router.replace(`/catalog?${next.toString()}` as Route);
  }

  // 검색어 디바운스
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(Array.from(params.entries()));
      if (q.trim()) next.set("q", q.trim());
      else next.delete("q");
      push(next);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="품목·공정 검색"
          className="pl-9 pr-9"
          inputMode="search"
        />
        {q ? (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => setParam("fav", fav ? null : "1")}
          className={cn(
            "tap-target inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors",
            fav
              ? "border-warning bg-warning/15 text-warning"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          <Star className={cn("size-4", fav && "fill-warning")} /> 즐겨찾기
        </button>

        <button
          type="button"
          onClick={() => setParam("cat", null)}
          className={cn(
            "tap-target whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
            !cat
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          전체
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setParam("cat", c)}
            className={cn(
              "tap-target whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
              cat === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
