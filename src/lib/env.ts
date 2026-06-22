import { z } from "zod";

/**
 * 환경변수 zod 검증.
 * - 서버 시작/빌드 시 잘못된 환경변수를 빠르게 실패시킨다.
 * - 클라이언트 번들에는 NEXT_PUBLIC_* 만 포함된다.
 */

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  // 선택값: 없으면 관련 기능이 우아하게 비활성화된다.
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const isServer = typeof window === "undefined";

function format(error: z.ZodError): string {
  return error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
}

function loadEnv() {
  // NEXT_PUBLIC_* 는 빌드 타임에 인라인되어야 하므로 직접 참조한다.
  const raw = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  };

  const schema = isServer ? serverSchema : clientSchema;
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(
      `❌ 환경변수 검증 실패 (.env.local 을 확인하세요):\n${format(parsed.error)}`,
    );
  }
  return parsed.data;
}

export const env = loadEnv();

/** 선택 기능 활성화 여부 — "키 없으면 우아하게 비활성" 정책 */
export const features = {
  /** AI 항목 추출 (금액 판단에는 사용 금지) */
  aiExtraction: isServer ? Boolean(process.env.ANTHROPIC_API_KEY) : false,
  /** 서비스 롤 키가 있어야 가능한 관리 작업 */
  adminTasks: isServer ? Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) : false,
} as const;
