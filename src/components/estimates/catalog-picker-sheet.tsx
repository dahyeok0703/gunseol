"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Search, X, Plus, Star } from "lucide-react";

import { formatKRW, calcMargin } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CatalogPickerItem } from "@/lib/data/catalog";

/**
 * 단가표 품목 선택 시트 (모바일 우선 전체 화면).
 * 검색 → 탭 → 즉시 추가(시트 유지) → 완료. 빠른 연속 추가를 위해 닫지 않는다.
 */
export function CatalogPickerSheet({
  open,
  items,
  onPick,
  onClose,
}: {
  open: boolean;
  items: CatalogPickerItem[];
  onPick: (item: CatalogPickerItem) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [addedCount, setAddedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setAddedCount(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(term) ||
        (it.category ?? "").toLowerCase().includes(term),
    );
  }, [q, items]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background pt-safe">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="품목·공정 검색"
            className="pl-9"
            inputMode="search"
          />
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="닫기" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            단가표가 비어있어요. 직접 입력으로 라인을 추가하거나, 단가표를 먼저 채워주세요.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">검색 결과가 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((it) => {
              const { rate } = calcMargin(it.default_unit_price, it.default_cost);
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(it);
                      setAddedCount((c) => c + 1);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors active:bg-secondary"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 truncate font-medium">
                        {it.is_favorite ? (
                          <Star className="size-3.5 shrink-0 fill-warning text-warning" />
                        ) : null}
                        {it.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[it.category, it.unit].filter(Boolean).join(" · ")}
                        {it.category || it.unit ? " · " : ""}
                        견적 {formatKRW(it.default_unit_price)} · 마진 {rate}%
                      </p>
                    </div>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Plus className="size-4" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 푸터 */}
      <div className="border-t border-border px-4 py-3 pb-safe">
        <Button type="button" variant="accent" size="touch" className="w-full" onClick={onClose}>
          {addedCount > 0 ? `${addedCount}개 추가 완료` : "완료"}
        </Button>
      </div>
    </div>
  );
}
