import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * 서비스 역할(admin) Supabase 클라이언트 — RLS 를 우회한다.
 * 결제(구독/이력) 쓰기, 웹훅 처리 등 서버 전용 작업에만 사용한다.
 * 절대 클라이언트로 노출 금지.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다.");
  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
