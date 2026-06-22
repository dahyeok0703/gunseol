"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { action, ActionError } from "@/lib/actions/safe-action";
import {
  loginSchema,
  signupSchema,
  resetRequestSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth";
import { env } from "@/lib/env";

async function siteUrl() {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * 회원가입.
 * workspace 자동 생성 + owner 등록은 DB 트리거(handle_new_user)가 처리한다.
 * 업체명은 user metadata(workspace_name)로 전달한다.
 */
export const signupAction = action(signupSchema, async ({ email, password, workspaceName }) => {
  const supabase = await createClient();
  const origin = await siteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { workspace_name: workspaceName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) throw new ActionError(error.message);

  // 이메일 확인이 필요한 프로젝트 설정이면 세션이 없다.
  const needsEmailConfirm = !data.session;
  return { needsEmailConfirm };
});

export const loginAction = action(loginSchema, async ({ email, password }) => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new ActionError("이메일 또는 비밀번호가 올바르지 않습니다.");
  revalidatePath("/", "layout");
  return { success: true };
});

export const resetRequestAction = action(resetRequestSchema, async ({ email }) => {
  const supabase = await createClient();
  const origin = await siteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });
  if (error) throw new ActionError(error.message);
  return { sent: true };
});

export const updatePasswordAction = action(updatePasswordSchema, async ({ password }) => {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new ActionError(error.message);
  revalidatePath("/", "layout");
  return { success: true };
});

/** 로그아웃 — 폼 action 으로 사용 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
