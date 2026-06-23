"use client";

import { Eye, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

/** 출력물 미리보기 / 다운로드 / 공유 (모바일: 네이티브 공유 시트) */
export function PdfActions({ url, title }: { url: string; title: string }) {
  async function share() {
    const absolute = typeof window !== "undefined" ? new URL(url, window.location.origin).href : url;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: absolute });
      } catch {
        /* 사용자가 취소 */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(absolute);
      toast.success("링크를 복사했어요.");
    } catch {
      toast.error("공유를 사용할 수 없어요.");
    }
  }

  return (
    <div className="flex items-center gap-1">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="tap-target inline-flex items-center gap-1 rounded-md px-2.5 text-xs font-medium text-foreground hover:bg-secondary"
      >
        <Eye className="size-4" /> 미리보기
      </a>
      <a
        href={`${url}?download=1`}
        className="tap-target inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label="다운로드"
      >
        <Download className="size-4" />
      </a>
      <button
        type="button"
        onClick={share}
        className="tap-target inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label="공유"
      >
        <Share2 className="size-4" />
      </button>
    </div>
  );
}
