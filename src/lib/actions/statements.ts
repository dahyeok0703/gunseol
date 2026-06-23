"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/context";
import { action, ActionError } from "@/lib/actions/safe-action";
import { statementCreateSchema, statementIdSchema } from "@/lib/validations/statement";

const nn = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export const createStatementAction = action(statementCreateSchema, async (input) => {
  const ctx = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("statements")
    .insert({
      workspace_id: ctx.workspaceId,
      project_id: input.project_id,
      type: input.type,
      vendor: nn(input.vendor),
      amount: input.amount,
      issued_on: input.issued_on ?? null,
      memo: nn(input.memo),
    })
    .select("id")
    .returns<{ id: string }[]>()
    .single();

  if (error || !data) throw new ActionError("저장에 실패했습니다.");
  revalidatePath(`/sites/${input.project_id}`);
  return { id: data.id };
});

export const deleteStatementAction = action(statementIdSchema, async ({ id }) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("statements")
    .delete()
    .eq("id", id)
    .select("project_id")
    .returns<{ project_id: string | null }[]>()
    .single();

  if (error) throw new ActionError("삭제에 실패했습니다.");
  if (data?.project_id) revalidatePath(`/sites/${data.project_id}`);
  return { id };
});
