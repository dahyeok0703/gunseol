import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, MemberRole } from "@/types/database";

type MemberRow = Database["public"]["Tables"]["members"]["Row"];
type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];

export interface AuthContext {
  userId: string;
  email: string | null;
  workspaceId: string;
  workspaceName: string;
  role: MemberRole;
  displayName: string | null;
}

/**
 * 현재 로그인 사용자 + 소속 workspace/member 컨텍스트를 가져온다.
 * - 대부분 1인 업자: 첫 번째(소유) workspace 를 사용한다.
 * - cache() 로 동일 요청 내 중복 조회를 방지한다.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("members")
    .select("workspace_id, role, display_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .returns<Pick<MemberRow, "workspace_id" | "role" | "display_name">[]>()
    .maybeSingle();

  if (!member) return null;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", member.workspace_id)
    .returns<Pick<WorkspaceRow, "name">[]>()
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    workspaceId: member.workspace_id,
    workspaceName: workspace?.name ?? "내 업체",
    role: member.role,
    displayName: member.display_name,
  };
});

/** 보호 페이지에서 사용 — 컨텍스트 없으면 로그인으로 리다이렉트 */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  return ctx;
}
