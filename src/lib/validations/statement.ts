import { z } from "zod";

export const statementCreateSchema = z.object({
  project_id: z.string().uuid(),
  type: z.enum(["purchase_order", "trade_statement"]),
  vendor: z.string().trim().max(60).optional().default(""),
  amount: z.coerce.number().min(0).max(1_000_000_000_000),
  issued_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다.").optional(),
  memo: z.string().trim().max(500).optional().default(""),
});

export const statementIdSchema = z.object({ id: z.string().uuid() });

export type StatementCreateInput = z.infer<typeof statementCreateSchema>;
