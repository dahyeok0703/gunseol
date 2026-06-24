import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/reset-password",
  "/update-password",
  "/auth",
  "/pricing",
  "/terms",
  "/privacy",
  "/refund",
  "/api/webhooks",
  "/api/cron",
  // SEO / 메타데이터 라우트
  "/opengraph-image",
  "/twitter-image",
  "/sitemap.xml",
  "/robots.txt",
];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * 세션 새로고침 + (app) 라우트 보호.
 * - 로그인 안 한 사용자가 보호 경로 접근 → /login 으로
 * - 로그인 한 사용자가 인증 경로 접근 → /dashboard 로
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const isAuthRoute = ["/login", "/signup", "/reset-password"].some((p) =>
    pathname.startsWith(p),
  );
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
