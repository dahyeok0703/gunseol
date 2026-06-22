import { z } from "zod";
import { PROJECT_STATUS_ORDER } from "@/lib/constants/project";

const statusEnum = z.enum(
  PROJECT_STATUS_ORDER as [string, ...string[]],
) as z.ZodType<(typeof PROJECT_STATUS_ORDER)[number]>;

export const projectCreateSchema = z.object({
  client_id: z.string().uuid("거래처를 선택해주세요."),
  name: z.string().trim().min(1, "현장명을 입력해주세요.").max(80, "현장명이 너무 깁니다."),
  site_address: z.string().trim().max(200).optional().default(""),
  status: statusEnum.default("estimating"),
  memo: z.string().trim().max(1000).optional().default(""),
});

export const projectUpdateSchema = projectCreateSchema.extend({
  id: z.string().uuid(),
});

export const projectStatusSchema = z.object({
  id: z.string().uuid(),
  status: statusEnum,
});

export const projectIdSchema = z.object({ id: z.string().uuid() });

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
