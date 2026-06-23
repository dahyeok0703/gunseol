import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Statement = Database["public"]["Tables"]["statements"]["Row"];

export async function getProjectStatements(projectId: string): Promise<Statement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("statements")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<Statement[]>();
  return data ?? [];
}

export async function getStatement(id: string): Promise<Statement | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("statements")
    .select("*")
    .eq("id", id)
    .returns<Statement[]>()
    .maybeSingle();
  return data ?? null;
}
