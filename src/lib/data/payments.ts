import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Payment = Database["public"]["Tables"]["payments"]["Row"];

/** 한 현장의 수금 항목 (예정일 빠른 순) */
export async function getProjectPayments(projectId: string): Promise<Payment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("project_id", projectId)
    .order("due_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .returns<Payment[]>();
  return data ?? [];
}
