"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { importCatalogAction } from "@/lib/actions/catalog";
import { Button } from "@/components/ui/button";
import type { CatalogItem } from "@/lib/data/catalog";

// 엑셀 헤더 ↔ 필드 매핑 (다양한 표기 허용)
const HEADER_MAP: Record<string, keyof ImportRow> = {
  공정: "category",
  카테고리: "category",
  category: "category",
  품목명: "name",
  품목: "name",
  이름: "name",
  name: "name",
  단위: "unit",
  unit: "unit",
  견적단가: "default_unit_price",
  단가: "default_unit_price",
  default_unit_price: "default_unit_price",
  실행단가: "default_cost",
  원가: "default_cost",
  default_cost: "default_cost",
};

interface ImportRow {
  category: string;
  name: string;
  unit: string;
  default_unit_price: number;
  default_cost: number;
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function CatalogExcel({ items }: { items: CatalogItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [, startTransition] = useTransition();

  async function onExport() {
    const XLSX = await import("xlsx");
    const rows = items.map((it) => ({
      공정: it.category ?? "",
      품목명: it.name,
      단위: it.unit ?? "",
      견적단가: it.default_unit_price,
      실행단가: it.default_cost,
    }));
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ["공정", "품목명", "단위", "견적단가", "실행단가"],
    });
    ws["!cols"] = [{ wch: 10 }, { wch: 24 }, { wch: 8 }, { wch: 12 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "단가표");
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `단가표_${today}.xlsx`);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 동일 파일 재선택 허용
    if (!file) return;

    setImporting(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]!];
      if (!sheet) throw new Error("시트를 찾을 수 없습니다.");
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      const rows: ImportRow[] = [];
      for (const r of raw) {
        const mapped: Partial<ImportRow> = {};
        for (const [key, val] of Object.entries(r)) {
          const field = HEADER_MAP[key.trim()];
          if (!field) continue;
          if (field === "default_unit_price" || field === "default_cost") {
            mapped[field] = toNumber(val);
          } else {
            mapped[field] = String(val ?? "").trim();
          }
        }
        if (!mapped.category || !mapped.name) continue; // 필수 누락 행 건너뜀
        rows.push({
          category: mapped.category,
          name: mapped.name,
          unit: mapped.unit ?? "",
          default_unit_price: mapped.default_unit_price ?? 0,
          default_cost: mapped.default_cost ?? 0,
        });
      }

      if (rows.length === 0) {
        toast.error("가져올 행이 없어요. (공정·품목명 열을 확인해주세요)");
        return;
      }

      startTransition(async () => {
        const res = await importCatalogAction({ rows });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success(`${res.data.inserted}개 품목을 가져왔어요.`);
        router.refresh();
      });
    } catch (err) {
      console.error(err);
      toast.error("엑셀 파일을 읽지 못했어요.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={onFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1"
        disabled={importing}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="size-4" /> {importing ? "가져오는 중…" : "엑셀 가져오기"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1"
        disabled={items.length === 0}
        onClick={onExport}
      >
        <Download className="size-4" /> 내보내기
      </Button>
    </div>
  );
}
