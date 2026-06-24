import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/pricing", "/terms", "/privacy", "/refund", "/login", "/signup"];
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
