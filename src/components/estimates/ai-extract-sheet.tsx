"use client";

import { useRef, useState } from "react";
import { X, Sparkles, ImageIcon, Type, Check, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface ExtractedLine {
  category: string;
  name: string;
  unit: string;
  qty: number;
  unit_price: number;
  cost: number;
  confidence: "high" | "medium" | "low";
  matched: boolean;
}

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
const MAX_BYTES = 6 * 1024 * 1024;

type Mode = "text" | "image";

export function AiExtractSheet({
  open,
  projectId,
  onClose,
  onAdd,
}: {
  open: boolean;
  projectId?: string;
  onClose: () => void;
  onAdd: (lines: ExtractedLine[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [image, setImage] = useState<{ data: string; mediaType: string; preview: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<(ExtractedLine & { picked: boolean })[] | null>(null);

  function reset() {
    setText("");
    setImage(null);
    setLines(null);
    setMode("text");
  }

  function close() {
    reset();
    onClose();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED.includes(file.type as (typeof ALLOWED)[number])) {
      toast.error("PNG/JPG/WEBP/GIF 이미지만 가능해요.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("이미지가 너무 커요. (최대 6MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.split(",")[1] ?? "";
      setImage({ data: base64, mediaType: file.type, preview: result });
      setLines(null);
    };
    reader.readAsDataURL(file);
  }

  async function extract() {
    if (mode === "text" && !text.trim()) {
      toast.error("내용을 붙여넣어 주세요.");
      return;
    }
    if (mode === "image" && !image) {
      toast.error("사진을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "image"
            ? { projectId, image: { data: image!.data, mediaType: image!.mediaType } }
            : { projectId, text },
        ),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "추출에 실패했어요.");
        return;
      }
      const extracted: ExtractedLine[] = json.data.lines;
      if (extracted.length === 0) {
        toast.message("추출된 항목이 없어요. 다른 사진/내용으로 시도해보세요.");
        return;
      }
      setLines(extracted.map((l) => ({ ...l, picked: true })));
      if (json.data.needsReview) {
        toast.warning("일부 항목은 확신이 낮아요. 추가 전에 꼭 확인해주세요.");
      }
    } catch {
      toast.error("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  function add() {
    const picked = (lines ?? []).filter((l) => l.picked);
    if (picked.length === 0) {
      toast.error("추가할 항목을 선택해주세요.");
      return;
    }
    onAdd(
      picked.map((l) => ({
        category: l.category,
        name: l.name,
        unit: l.unit,
        qty: l.qty,
        unit_price: l.unit_price,
        cost: l.cost,
        confidence: l.confidence,
        matched: l.matched,
      })),
    );
    toast.success(`${picked.length}개 항목을 추가했어요. 단가를 확인해주세요.`);
    close();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background pt-safe">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-5 text-warning" /> 사진·메시지로 항목 채우기
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="닫기" onClick={close}>
          <X className="size-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!lines ? (
          <div className="space-y-4">
            {/* 입력 모드 */}
            <div className="flex rounded-lg bg-secondary p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setMode("text")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 transition-colors",
                  mode === "text" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                <Type className="size-4" /> 텍스트
              </button>
              <button
                type="button"
                onClick={() => setMode("image")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 transition-colors",
                  mode === "image" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                <ImageIcon className="size-4" /> 사진
              </button>
            </div>

            {mode === "text" ? (
              <Textarea
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="카톡 대화나 메모 내용을 붙여넣으세요.&#10;예) 거실 도배 32평, 욕실 타일 8평, 철거 한식…"
              />
            ) : (
              <div className="space-y-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={onFile}
                />
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.preview}
                    alt="선택한 사진"
                    className="max-h-64 w-full rounded-lg border border-border object-contain"
                  />
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageIcon className="size-4" /> {image ? "사진 변경" : "카톡 캡처·메모 사진 선택"}
                </Button>
              </div>
            )}

            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              AI 는 <b className="mx-0.5 font-semibold">항목만 추출</b>합니다. 금액은 단가표에서
              채워지며 최종 확인·책임은 업체에 있어요. (필요한 내용만 전송됩니다)
            </p>

            <Button
              type="button"
              variant="accent"
              size="touch"
              className="w-full"
              disabled={loading}
              onClick={extract}
            >
              <Sparkles className="size-4" /> {loading ? "추출 중…" : "항목 추출"}
            </Button>
          </div>
        ) : (
          // 결과 검수
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              추출된 항목입니다. 체크한 항목만 추가돼요. <b>금액은 추가 후 꼭 확인하세요.</b>
            </p>
            <ul className="space-y-2">
              {lines.map((l, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() =>
                      setLines((prev) =>
                        (prev ?? []).map((x, j) => (j === i ? { ...x, picked: !x.picked } : x)),
                      )
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      l.picked ? "border-primary bg-card" : "border-border bg-card/50 opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md border",
                        l.picked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {l.picked ? <Check className="size-3.5" /> : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{l.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[l.category, l.unit].filter(Boolean).join(" · ")}
                        {l.category || l.unit ? " · " : ""}
                        수량 {l.qty}
                        {l.matched ? " · 단가표 매칭" : ""}
                      </p>
                    </div>
                    {l.confidence === "low" ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
                        <AlertTriangle className="size-3" /> 확인 필요
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="border-t border-border px-4 py-3 pb-safe">
        {lines ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="touch" className="flex-1" onClick={reset}>
              다시
            </Button>
            <Button
              type="button"
              variant="accent"
              size="touch"
              className="flex-[2]"
              onClick={add}
            >
              선택 항목 추가
            </Button>
          </div>
        ) : (
          <Button type="button" variant="ghost" size="touch" className="w-full" onClick={close}>
            취소
          </Button>
        )}
      </div>
    </div>
  );
}
