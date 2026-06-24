"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/context";
import { action, ActionError } from "@/lib/actions/safe-action";
import { planLimits } from "@/lib/constants/plan";
import type { WorkspacePlan } from "@/types/database";
import {
  projectCreateSchema,
  projectUpdateSchema,
  projectStatusSchema,
  projectIdSchema,
} from "@/lib/validations/project";

const nn = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export const createProjectAction = action(projectCreateSchema, async (input) => {
  const ctx = await requireAuth();
  const supabase = await createClient();

  // 플랜 한도(현장 수) enforcement
  const { data: ws } = await supabase
    .from("workspaces")
    .select("plan")
    .eq("id", ctx.workspaceId)
    .returns<{ plan: WorkspacePlan }[]>()
    .maybeSingle();
  const limit = planLimits(ws?.plan ?? "free").maxProjects;
  if (Number.isFinite(limit)) {
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null);
    if ((count ?? 0) >= limit) {
      throw new ActionError(
        `무료 플랜은 현장 ${limit}개까지예요. Pro 로 업그레이드하면 무제한이에요.`,
      );
    }
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: ctx.workspaceId,
      client_id: input.client_id,
      name: input.name,
      site_address: nn(input.site_address),
      status: input.status,
      memo: nn(input.memo),
    })
    .select("id")
    .returns<{ id: string }[]>()
    .single();

  if (error || !data) throw new ActionError("현장 저장에 실패했습니다.");
  revalidatePath("/sites");
  return { id: data.id };
});

export const updateProjectAction = action(projectUpdateSchema, async (input) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      client_id: input.client_id,
      name: input.name,
      site_address: nn(input.site_address),
      status: input.status,
      memo: nn(input.memo),
    })
    .eq("id", input.id)
    .is("deleted_at", null);

  if (error) throw new ActionError("현장 수정에 실패했습니다.");
  revalidatePath("/sites");
  revalidatePath(`/sites/${input.id}`);
  return { id: input.id };
});

/** 상태 전환 (견적중 → 계약 → 진행중 → 완료) */
export const updateProjectStatusAction = action(projectStatusSchema, async ({ id, status }) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new ActionError("상태 변경에 실패했습니다.");
  revalidatePath("/sites");
  revalidatePath(`/sites/${id}`);
  return { id, status };
});

/** soft delete */
export const deleteProjectAction = action(projectIdSchema, async ({ id }) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new ActionError("현장 삭제에 실패했습니다.");
  revalidatePath("/sites");
  return { id };
});
