import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 보호 라우트·API 는 크롤링 제외
      disallow: [
        "/dashboard",
        "/clients",
        "/sites",
        "/catalog",
        "/estimates",
        "/settings",
        "/billing",
        "/api/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
