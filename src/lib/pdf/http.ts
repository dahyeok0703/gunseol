import "server-only";
import type { NextRequest } from "next/server";

/** PDF 버퍼를 미리보기(inline) 또는 다운로드(?download=1) 응답으로 변환 */
export function pdfResponse(buffer: Buffer, baseName: string, request: NextRequest): Response {
  const download = request.nextUrl.searchParams.get("download") === "1";
  const safe = baseName.replace(/[/\\?%*:|"<>]/g, "_").trim() || "document";
  const filename = encodeURIComponent(`${safe}.pdf`);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${filename}`,
      "cache-control": "private, no-store",
    },
  });
}
