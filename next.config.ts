import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // react-pdf 는 서버에서 번들링하지 않고 외부 패키지로 둔다(fontkit 등 네이티브 의존).
  serverExternalPackages: ["@react-pdf/renderer"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
