import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";
import { Providers } from "@/components/providers";

const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const description =
  "1인·소규모 인테리어 업자를 위한 모바일 우선 견적·현장관리 도구. 현장에서 폰으로 5분 만에 견적을 만들고, 견적가/실행가로 마진까지 한눈에.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "건설 — 인테리어 견적·현장관리",
    template: "%s · 건설",
  },
  description,
  applicationName: "건설",
  keywords: ["인테리어 견적", "현장관리", "견적서", "마진 관리", "수금", "인테리어 SaaS"],
  authors: [{ name: "건설" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "건설",
  },
  formatDetection: { telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "건설",
    title: "건설 — 현장에서 폰으로, 견적부터 수금까지",
    description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "건설 — 현장에서 폰으로, 견적부터 수금까지",
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
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
