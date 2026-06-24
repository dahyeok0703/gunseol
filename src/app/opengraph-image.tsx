import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const alt = "건설 — 현장에서 폰으로, 견적부터 수금까지";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 브랜드 팔레트(globals.css 토큰 근사 hex): 차콜 + 모래색 + 앰버
const CHARCOAL = "#2A2521";
const SAND = "#F5EFE3";
const AMBER = "#F6A723";
const MUTED = "#C9BFAE";

export default async function OgImage() {
  const bold = readFileSync(path.join(process.cwd(), "public", "fonts", "NotoSansKR-Bold.otf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CHARCOAL,
          padding: "72px 80px",
          fontFamily: "NotoSansKR",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: AMBER,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              color: CHARCOAL,
            }}
          >
            건
          </div>
          <div style={{ fontSize: 40, color: SAND }}>건설</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 76, color: SAND, lineHeight: 1.15 }}>
            현장에서 폰으로 5분 만에 견적,
          </div>
          <div style={{ fontSize: 76, color: AMBER, lineHeight: 1.15 }}>마진까지 한눈에</div>
        </div>

        <div style={{ fontSize: 32, color: MUTED }}>
          1인·소규모 인테리어 업자를 위한 모바일 견적·현장관리
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "NotoSansKR", data: bold, weight: 700, style: "normal" }],
    },
  );
}
