"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/context";
import { action, ActionError } from "@/lib/actions/safe-action";
import {
  clientCreateSchema,
  clientUpdateSchema,
  clientIdSchema,
} from "@/lib/validations/client";

const nn = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export const createClientAction = action(clientCreateSchema, async (input) => {
  const ctx = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      workspace_id: ctx.workspaceId,
      name: input.name,
      phone: nn(input.phone),
      address: nn(input.address),
      memo: nn(input.memo),
    })
    .select("id")
    .returns<{ id: string }[]>()
    .single();

  if (error || !data) throw new ActionError("거래처 저장에 실패했습니다.");
  revalidatePath("/clients");
  return { id: data.id };
});

export const updateClientAction = action(clientUpdateSchema, async (input) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: input.name,
      phone: nn(input.phone),
      address: nn(input.address),
      memo: nn(input.memo),
    })
    .eq("id", input.id)
    .is("deleted_at", null);

  if (error) throw new ActionError("거래처 수정에 실패했습니다.");
  revalidatePath("/clients");
  revalidatePath(`/clients/${input.id}`);
  return { id: input.id };
});

/** soft delete */
export const deleteClientAction = action(clientIdSchema, async ({ id }) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new ActionError("거래처 삭제에 실패했습니다.");
  revalidatePath("/clients");
  return { id };
});
