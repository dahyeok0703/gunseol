"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { action, ActionError } from "@/lib/actions/safe-action";
import { createEstimateSchema, estimateStatusSchema } from "@/lib/validations/estimate";
import type { Json } from "@/types/database";

/**
 * 견적 생성 (수정 시에도 호출 → 새 버전).
 * 합계는 서버(create_estimate RPC)에서 라인으로 재계산한다.
 *
 * ⚠️ 견적 금액은 업체가 최종 확인·책임지며, 본 도구는 작성을 보조한다.
 */
export const createEstimateAction = action(createEstimateSchema, async (input) => {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_estimate", {
    p_project_id: input.project_id,
    p_status: input.status,
    p_memo: input.memo ?? "",
    p_lines: input.lines as unknown as Json,
  });

  if (error || !data) throw new ActionError("견적 저장에 실패했습니다.");

  revalidatePath(`/sites/${input.project_id}`);
  revalidatePath("/estimates");
  return { id: data.id, version: data.version, projectId: input.project_id };
});

export const updateEstimateStatusAction = action(estimateStatusSchema, async ({ id, status }) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("estimates")
    .update({ status })
    .eq("id", id)
    .select("project_id")
    .returns<{ project_id: string | null }[]>()
    .single();

  if (error) throw new ActionError("상태 변경에 실패했습니다.");
  if (data?.project_id) revalidatePath(`/sites/${data.project_id}`);
  revalidatePath("/estimates");
  return { id, status };
});
