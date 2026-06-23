"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/context";
import { action, ActionError } from "@/lib/actions/safe-action";
import {
  taskCreateSchema,
  taskUpdateSchema,
  taskToggleSchema,
  taskReorderSchema,
  taskIdSchema,
  taskPhotoCreateSchema,
} from "@/lib/validations/task";

function refresh(projectId: string) {
  revalidatePath(`/sites/${projectId}`);
  revalidatePath("/dashboard");
}

export const createTaskAction = action(taskCreateSchema, async (input) => {
  const ctx = await requireAuth();
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("project_id", input.project_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .returns<{ sort_order: number }[]>()
    .maybeSingle();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: ctx.workspaceId,
      project_id: input.project_id,
      name: input.name,
      due_on: input.due_on ?? null,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select("id")
    .returns<{ id: string }[]>()
    .single();

  if (error || !data) throw new ActionError("공정 추가에 실패했습니다.");
  refresh(input.project_id);
  return { id: data.id };
});

export const updateTaskAction = action(taskUpdateSchema, async (input) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ name: input.name, due_on: input.due_on ?? null })
    .eq("id", input.id)
    .select("project_id")
    .returns<{ project_id: string }[]>()
    .single();
  if (error) throw new ActionError("수정에 실패했습니다.");
  if (data) refresh(data.project_id);
  return { id: input.id };
});

export const toggleTaskAction = action(taskToggleSchema, async ({ id, done }) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .select("project_id")
    .returns<{ project_id: string }[]>()
    .single();
  if (error) throw new ActionError("상태 변경에 실패했습니다.");
  if (data) refresh(data.project_id);
  return { id, done };
});

export const deleteTaskAction = action(taskIdSchema, async ({ id }) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .select("project_id")
    .returns<{ project_id: string }[]>()
    .single();
  if (error) throw new ActionError("삭제에 실패했습니다.");
  if (data) refresh(data.project_id);
  return { id };
});

/** 드래그 정렬 — ids 순서대로 sort_order 재배치 */
export const reorderTasksAction = action(taskReorderSchema, async ({ project_id, ids }) => {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_tasks", { p_ids: ids });
  if (error) throw new ActionError("순서 변경에 실패했습니다.");
  refresh(project_id);
  return { ok: true };
});

export const createTaskPhotoAction = action(taskPhotoCreateSchema, async (input) => {
  const ctx = await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from("task_photos").insert({
    workspace_id: ctx.workspaceId,
    task_id: input.task_id,
    project_id: input.project_id,
    file_path: input.file_path,
    caption: input.caption?.trim() || null,
  });
  if (error) throw new ActionError("사진 저장에 실패했습니다.");
  refresh(input.project_id);
  return { ok: true };
});

export const deleteTaskPhotoAction = action(taskIdSchema, async ({ id }) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_photos")
    .delete()
    .eq("id", id)
    .select("project_id, file_path")
    .returns<{ project_id: string; file_path: string }[]>()
    .single();
  if (error) throw new ActionError("사진 삭제에 실패했습니다.");
  if (data) {
    // 스토리지 객체도 정리 (best-effort)
    await supabase.storage.from("site").remove([data.file_path]);
    refresh(data.project_id);
  }
  return { id };
});
