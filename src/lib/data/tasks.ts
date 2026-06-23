import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];

/** 한 현장의 공정 목록 (정렬순) */
export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Task[]>();
  return data ?? [];
}

/** 공정별 첨부 사진 수 */
export async function getProjectPhotoCounts(projectId: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_photos")
    .select("task_id")
    .eq("project_id", projectId)
    .returns<{ task_id: string }[]>();
  const counts: Record<string, number> = {};
  for (const r of data ?? []) counts[r.task_id] = (counts[r.task_id] ?? 0) + 1;
  return counts;
}

export type AgendaTask = Pick<Task, "id" | "name" | "due_on" | "project_id"> & {
  project_name: string | null;
};

/**
 * 오늘/이번 주 할 공정 (여러 현장 통합).
 * 미완료 + 예정일이 이번 주 일요일까지(지연분 포함)인 공정.
 */
export async function getAgendaTasks(
  workspaceId: string,
  weekEndIso: string,
): Promise<AgendaTask[]> {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, name, due_on, project_id")
    .eq("workspace_id", workspaceId)
    .eq("done", false)
    .not("due_on", "is", null)
    .lte("due_on", weekEndIso)
    .order("due_on", { ascending: true })
    .returns<Pick<Task, "id" | "name" | "due_on" | "project_id">[]>();

  if (!tasks || tasks.length === 0) return [];

  const projectIds = Array.from(new Set(tasks.map((t) => t.project_id)));
  const nameMap = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds)
      .returns<{ id: string; name: string }[]>();
    for (const p of projects ?? []) nameMap.set(p.id, p.name);
  }

  return tasks.map((t) => ({ ...t, project_name: nameMap.get(t.project_id) ?? null }));
}
