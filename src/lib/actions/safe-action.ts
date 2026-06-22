import { z } from "zod";

/**
 * 공통 server action 래퍼.
 * 모든 server action 은 { ok, data, error } 형태로 결과를 반환한다.
 * 클라이언트(폼)는 이 한 가지 모양만 처리하면 된다.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** server action 내부에서 던져 사용자에게 그대로 노출할 메시지 */
export class ActionError extends Error {}

type Handler<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

/**
 * zod 스키마로 입력을 검증한 뒤 핸들러를 실행한다.
 * - 검증 실패 → fieldErrors 와 함께 fail
 * - ActionError → 메시지 그대로 fail
 * - 기타 예외 → 로깅 후 일반 메시지 fail
 */
export function action<TSchema extends z.ZodTypeAny, TOutput>(
  schema: TSchema,
  handler: Handler<z.infer<TSchema>, TOutput>,
) {
  return async (input: z.infer<TSchema>): Promise<ActionResult<TOutput>> => {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return fail("입력값을 확인해주세요.", parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >);
    }

    try {
      const data = await handler(parsed.data);
      return ok(data);
    } catch (error) {
      if (error instanceof ActionError) {
        return fail(error.message);
      }
      console.error("[action] 처리 중 오류:", error);
      return fail("처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };
}
