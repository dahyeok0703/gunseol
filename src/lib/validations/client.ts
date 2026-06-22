import { z } from "zod";

export const clientCreateSchema = z.object({
  name: z.string().trim().min(1, "거래처명을 입력해주세요.").max(60, "거래처명이 너무 깁니다."),
  phone: z.string().trim().max(30).optional().default(""),
  address: z.string().trim().max(200).optional().default(""),
  memo: z.string().trim().max(1000).optional().default(""),
});

export const clientUpdateSchema = clientCreateSchema.extend({
  id: z.string().uuid(),
});

export const clientIdSchema = z.object({ id: z.string().uuid() });

export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;
