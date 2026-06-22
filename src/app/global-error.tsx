"use client";

import { useEffect } from "react";

/**
 * 루트 레이아웃에서 발생한 오류까지 잡는 최상위 에러 바운더리.
 * 자체 <html>/<body> 를 렌더링해야 한다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f5efe3",
          color: "#2b2723",
          padding: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            문제가 발생했습니다
          </h1>
          <p style={{ color: "#6b6258", marginBottom: "1.25rem", fontSize: "0.95rem" }}>
            잠시 후 다시 시도해주세요. 계속되면 새로고침 해주세요.
          </p>
          <button
            onClick={reset}
            style={{
              height: 48,
              padding: "0 1.5rem",
              borderRadius: 12,
              border: "none",
              background: "#f59e0b",
              color: "#1c1a17",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
