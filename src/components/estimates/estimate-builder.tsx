"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, Pencil, Trash2, Info } from "lucide-react";

import { cn, formatKRW, calcMargin } from "@/lib/utils";
import { createEstimateAction } from "@/lib/actions/estimates";
import { ESTIMATE_STATUS_ORDER, estimateStatusMeta } from "@/lib/constants/estimate";
import { ESTIMATE_DISCLAIMER } from "@/lib/constants/disclaimer";
import type { EstimateStatus } from "@/types/database";
import type { CatalogPickerItem } from "@/lib/data/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarginSummary } from "@/components/estimates/margin-summary";
import { CatalogPickerSheet } from "@/components/estimates/catalog-picker-sheet";

interface LineDraft {
  key: string;
  category: string;
  name: string;
  unit: string;
  qty: string;
  unit_price: string;
  cost: string;
}

export interface EstimateInitial {
  status?: EstimateStatus;
  memo?: string;
  lines?: Array<Partial<Omit<LineDraft, "key">>>;
}

const num = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

let keySeq = 0;
const newKey = () => `l${keySeq++}_${Math.random().toString(36).slice(2, 7)}`;

function toDraft(p: Partial<Omit<LineDraft, "key">> = {}): LineDraft {
  return {
    key: newKey(),
    category: p.category ?? "",
    name: p.name ?? "",
    unit: p.unit ?? "",
    qty: p.qty ?? "1",
    unit_price: p.unit_price ?? "0",
    cost: p.cost ?? "0",
  };
}

const selectClass =
  "h-10 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EstimateBuilder({
  projectId,
  catalogItems,
  initial,
}: {
  projectId: string;
  catalogItems: CatalogPickerItem[];
  initial?: EstimateInitial;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState<EstimateStatus>(initial?.status ?? "draft");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [lines, setLines] = useState<LineDraft[]>(
    initial?.lines?.length ? initial.lines.map(toDraft) : [],
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  // 실시간 합계 ★
  const totalPrice = lines.reduce((s, l) => s + num(l.qty) * num(l.unit_price), 0);
  const totalCost = lines.reduce((s, l) => s + num(l.qty) * num(l.cost), 0);

  function update(key: string, field: keyof LineDraft, value: string) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
  }
  function remove(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }
  function addFromCatalog(it: CatalogPickerItem) {
    setLines((prev) => [
      ...prev,
      toDraft({
        category: it.category ?? "",
        name: it.name,
        unit: it.unit ?? "",
        qty: "1",
        unit_price: String(it.default_unit_price),
        cost: String(it.default_cost),
      }),
    ]);
  }

  function save() {
    const payload = lines
      .filter((l) => l.name.trim())
      .map((l) => ({
        category: l.category.trim(),
        name: l.name.trim(),
        unit: l.unit.trim(),
        qty: num(l.qty),
        unit_price: num(l.unit_price),
        cost: num(l.cost),
      }));

    if (payload.length === 0) {
      toast.error("품목을 1개 이상 추가해주세요.");
      return;
    }

    startTransition(async () => {
      const res = await createEstimateAction({ project_id: projectId, status, memo, lines: payload });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`견적 v${res.data.version} 저장 완료`);
      router.replace(`/sites/${projectId}/estimates/${res.data.id}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* 실시간 마진 — 스크롤해도 항상 보이게 상단 고정 ★ */}
      <div className="sticky top-14 z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur">
        <MarginSummary price={totalPrice} cost={totalCost} compact />
      </div>

      {/* 상태 */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">상태</span>
        <select
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value as EstimateStatus)}
        >
          {ESTIMATE_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {estimateStatusMeta[s].label}
            </option>
          ))}
        </select>
      </div>

      {/* 라인 목록 */}
      {lines.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
          품목을 추가해 견적을 시작하세요.
        </div>
      ) : (
        <ul className="space-y-3">
          {lines.map((l, i) => (
            <LineCard
              key={l.key}
              line={l}
              index={i + 1}
              onChange={(f, v) => update(l.key, f, v)}
              onRemove={() => remove(l.key)}
            />
          ))}
        </ul>
      )}

      {/* 라인 추가 */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="flex-1"
          onClick={() => setPickerOpen(true)}
        >
          <BookOpen className="size-4" /> 단가표에서 추가
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => setLines((prev) => [...prev, toDraft()])}
        >
          <Pencil className="size-4" /> 직접 입력
        </Button>
      </div>

      {/* 메모 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">메모</label>
        <Textarea
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="견적 관련 메모 (선택)"
        />
      </div>

      {/* 책임 고지 ⚠️ */}
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {ESTIMATE_DISCLAIMER}
      </p>

      <div className="flex gap-2 pb-2">
        <Button
          type="button"
          variant="outline"
          size="touch"
          className="flex-1"
          onClick={() => router.back()}
          disabled={isPending}
        >
          취소
        </Button>
        <Button
          type="button"
          variant="accent"
          size="touch"
          className="flex-[2]"
          onClick={save}
          disabled={isPending}
        >
          {isPending ? "저장 중…" : "견적 저장"}
        </Button>
      </div>

      <CatalogPickerSheet
        open={pickerOpen}
        items={catalogItems}
        onPick={addFromCatalog}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}

function LineCard({
  line,
  index,
  onChange,
  onRemove,
}: {
  line: LineDraft;
  index: number;
  onChange: (field: keyof LineDraft, value: string) => void;
  onRemove: () => void;
}) {
  const qty = num(line.qty);
  const amount = qty * num(line.unit_price);
  const costAmount = qty * num(line.cost);
  const { margin, rate } = calcMargin(amount, costAmount);
  const loss = margin < 0;

  return (
    <li className="space-y-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <span className="num text-xs font-semibold text-muted-foreground">{index}</span>
        <Input
          value={line.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="품목명"
          className="h-10 flex-1"
        />
        <button
          type="button"
          aria-label="라인 삭제"
          onClick={onRemove}
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <LField label="공정">
          <Input
            value={line.category}
            onChange={(e) => onChange("category", e.target.value)}
            placeholder="예) 도배"
            className="h-9"
          />
        </LField>
        <LField label="단위">
          <Input
            value={line.unit}
            onChange={(e) => onChange("unit", e.target.value)}
            placeholder="㎡/개/식"
            className="h-9"
          />
        </LField>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <LField label="수량">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={line.qty}
            onChange={(e) => onChange("qty", e.target.value)}
            className="h-9"
          />
        </LField>
        <LField label="견적단가">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={line.unit_price}
            onChange={(e) => onChange("unit_price", e.target.value)}
            className="h-9"
          />
        </LField>
        <LField label="실행단가">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={line.cost}
            onChange={(e) => onChange("cost", e.target.value)}
            className="h-9"
          />
        </LField>
      </div>

      {/* 라인 합계: 견적금액 + 마진 */}
      <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
        <span className="text-xs text-muted-foreground">
          견적금액 <span className="num font-bold text-foreground">{formatKRW(amount)}</span>
        </span>
        <span className={cn("num font-semibold", loss ? "text-loss" : "text-profit")}>
          마진 {formatKRW(margin)} ({rate}%)
        </span>
      </div>
    </li>
  );
}

function LField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
