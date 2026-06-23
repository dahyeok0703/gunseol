"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/context";
import { action, ActionError } from "@/lib/actions/safe-action";
import { companySchema } from "@/lib/validations/company";

const nn = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

/** 업체 프로필(출력물용) 저장. owner 만 가능(workspaces update RLS). */
export const updateCompanyAction = action(companySchema, async (input) => {
  const ctx = await requireAuth();
  if (ctx.role !== "owner") throw new ActionError("대표만 업체 정보를 수정할 수 있습니다.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({
      biz_name: nn(input.biz_name),
      biz_owner: nn(input.biz_owner),
      biz_reg_no: nn(input.biz_reg_no),
      biz_phone: nn(input.biz_phone),
      biz_address: nn(input.biz_address),
      logo_path: input.logo_path ?? null,
      stamp_path: input.stamp_path ?? null,
    })
    .eq("id", ctx.workspaceId);

  if (error) throw new ActionError("업체 정보 저장에 실패했습니다.");
  revalidatePath("/settings/company");
  revalidatePath("/settings");
  return { ok: true };
});
