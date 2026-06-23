import { z } from "zod";
import { ESTIMATE_STATUS_ORDER } from "@/lib/constants/estimate";

const statusEnum = z.enum(ESTIMATE_STATUS_ORDER as [string, ...string[]]) as z.ZodType<
  (typeof ESTIMATE_STATUS_ORDER)[number]
>;

const money = z.coerce.number().min(0, "0 이상").max(1_000_000_000_000);

export const estimateLineSchema = z.object({
  category: z.string().trim().max(40).optional().default(""),
  name: z.string().trim().min(1, "품목명을 입력해주세요.").max(80),
  unit: z.string().trim().max(20).optional().default(""),
  qty: z.coerce.number().min(0, "0 이상").max(1_000_000),
  unit_price: money,
  cost: money,
});

export const createEstimateSchema = z.object({
  project_id: z.string().uuid(),
  status: statusEnum.default("draft"),
  memo: z.string().trim().max(1000).optional().default(""),
  lines: z
    .array(estimateLineSchema)
    .min(1, "품목을 1개 이상 추가해주세요.")
    .max(200, "라인이 너무 많습니다."),
});

export const estimateStatusSchema = z.object({
  id: z.string().uuid(),
  status: statusEnum,
});

export type EstimateLineInput = z.infer<typeof estimateLineSchema>;
export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
