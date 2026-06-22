import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "건설 — 인테리어 견적·현장관리",
    template: "%s · 건설",
  },
  description:
    "1인·소규모 인테리어 업자를 위한 모바일 우선 견적·현장관리 도구. 견적가/실행가 분리로 마진까지 한눈에.",
  applicationName: "건설",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "건설",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // 모바일 우선: 노치/홈바 영역까지 활용
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5efe3" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1a17" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
