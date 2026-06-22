import { z } from "zod";

const password = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .max(72, "비밀번호가 너무 깁니다.");

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const signupSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
  password,
  workspaceName: z
    .string()
    .min(1, "업체명을 입력해주세요.")
    .max(60, "업체명이 너무 깁니다."),
});

export const resetRequestSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
});

export const updatePasswordSchema = z.object({
  password,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
