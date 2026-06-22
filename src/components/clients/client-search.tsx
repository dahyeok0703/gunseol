"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

/** 거래처 검색 — 입력을 디바운스해 URL ?q= 로 반영(서버 컴포넌트 재조회) */
export function ClientSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(Array.from(params.entries()));
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      startTransition(() => router.replace(`/clients?${next.toString()}` as Route));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="이름·연락처·주소 검색"
        className="pl-9 pr-9"
        inputMode="search"
      />
      {value ? (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
