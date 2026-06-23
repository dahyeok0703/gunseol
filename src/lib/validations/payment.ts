import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다.");

export const paymentCreateSchema = z.object({
  project_id: z.string().uuid(),
  label: z.string().trim().min(1, "항목명을 입력해주세요.").max(40),
  amount: z.coerce.number().min(0).max(1_000_000_000_000),
  due_on: dateStr.optional().nullable(),
});

export const paymentUpdateSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(40),
  amount: z.coerce.number().min(0).max(1_000_000_000_000),
  due_on: dateStr.optional().nullable(),
});

export const paymentToggleSchema = z.object({
  id: z.string().uuid(),
  paid: z.boolean(),
});

export const paymentIdSchema = z.object({ id: z.string().uuid() });

export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
