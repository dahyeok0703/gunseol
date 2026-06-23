"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/context";
import { action, ActionError } from "@/lib/actions/safe-action";
import {
  paymentCreateSchema,
  paymentUpdateSchema,
  paymentToggleSchema,
  paymentIdSchema,
} from "@/lib/validations/payment";

// payments 는 owner 쓰기(RLS). 친절한 메시지를 위해 명시적으로 확인한다.
async function ensureOwner() {
  const ctx = await requireAuth();
  if (ctx.role !== "owner") throw new ActionError("대표만 수금 항목을 관리할 수 있습니다.");
  return ctx;
}

function refresh(projectId: string) {
  revalidatePath(`/sites/${projectId}`);
  revalidatePath("/dashboard");
}

export const createPaymentAction = action(paymentCreateSchema, async (input) => {
  const ctx = await ensureOwner();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      workspace_id: ctx.workspaceId,
      project_id: input.project_id,
      label: input.label,
      amount: input.amount,
      due_on: input.due_on ?? null,
      status: "pending",
    })
    .select("id")
    .returns<{ id: string }[]>()
    .single();
  if (error || !data) throw new ActionError("수금 항목 저장에 실패했습니다.");
  refresh(input.project_id);
  return { id: data.id };
});

export const updatePaymentAction = action(paymentUpdateSchema, async (input) => {
  await ensureOwner();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .update({ label: input.label, amount: input.amount, due_on: input.due_on ?? null })
    .eq("id", input.id)
    .select("project_id")
    .returns<{ project_id: string }[]>()
    .single();
  if (error) throw new ActionError("수정에 실패했습니다.");
  if (data) refresh(data.project_id);
  return { id: input.id };
});

/** 입금여부 토글 */
export const togglePaidAction = action(paymentToggleSchema, async ({ id, paid }) => {
  await ensureOwner();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .update({
      status: paid ? "paid" : "pending",
      paid_on: paid ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", id)
    .select("project_id")
    .returns<{ project_id: string }[]>()
    .single();
  if (error) throw new ActionError("상태 변경에 실패했습니다.");
  if (data) refresh(data.project_id);
  return { id, paid };
});

export const deletePaymentAction = action(paymentIdSchema, async ({ id }) => {
  await ensureOwner();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .delete()
    .eq("id", id)
    .select("project_id")
    .returns<{ project_id: string }[]>()
    .single();
  if (error) throw new ActionError("삭제에 실패했습니다.");
  if (data) refresh(data.project_id);
  return { id };
});
