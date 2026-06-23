import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Estimate = Database["public"]["Tables"]["estimates"]["Row"];
export type EstimateLine = Database["public"]["Tables"]["estimate_lines"]["Row"];

/** 한 현장의 견적 목록 (최신 버전 우선) */
export async function getProjectEstimates(projectId: string): Promise<Estimate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("estimates")
    .select("*")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .returns<Estimate[]>();
  return data ?? [];
}

/** 견적 + 라인 */
export async function getEstimateWithLines(
  id: string,
): Promise<{ estimate: Estimate; lines: EstimateLine[] } | null> {
  const supabase = await createClient();
  const { data: estimate } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .returns<Estimate[]>()
    .maybeSingle();
  if (!estimate) return null;

  const { data: lines } = await supabase
    .from("estimate_lines")
    .select("*")
    .eq("estimate_id", id)
    .order("sort_order", { ascending: true })
    .returns<EstimateLine[]>();

  return { estimate, lines: lines ?? [] };
}

export type EstimateWithProject = Estimate & { project_name: string | null };

/** workspace 전체 견적 목록 + 현장명 (목록 화면용) */
export async function listWorkspaceEstimates(workspaceId: string): Promise<EstimateWithProject[]> {
  const supabase = await createClient();
  const { data: estimates } = await supabase
    .from("estimates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .returns<Estimate[]>();

  if (!estimates || estimates.length === 0) return [];

  const projectIds = Array.from(
    new Set(estimates.map((e) => e.project_id).filter((v): v is string => Boolean(v))),
  );

  const nameMap = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds)
      .returns<{ id: string; name: string }[]>();
    for (const p of projects ?? []) nameMap.set(p.id, p.name);
  }

  return estimates.map((e) => ({
    ...e,
    project_name: e.project_id ? (nameMap.get(e.project_id) ?? null) : null,
  }));
}
