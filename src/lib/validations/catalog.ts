import { z } from "zod";

const price = z.coerce
  .number({ invalid_type_error: "숫자를 입력해주세요." })
  .min(0, "0 이상이어야 합니다.")
  .max(1_000_000_000, "값이 너무 큽니다.");

export const catalogItemCreateSchema = z.object({
  category: z.string().trim().min(1, "공정을 선택하거나 입력해주세요.").max(40),
  name: z.string().trim().min(1, "품목명을 입력해주세요.").max(80),
  unit: z.string().trim().max(20).optional().default(""),
  default_unit_price: price.default(0),
  default_cost: price.default(0),
});

export const catalogItemUpdateSchema = catalogItemCreateSchema.extend({
  id: z.string().uuid(),
});

export const catalogIdSchema = z.object({ id: z.string().uuid() });

export const favoriteSchema = z.object({
  id: z.string().uuid(),
  is_favorite: z.boolean(),
});

/** 엑셀 일괄 등록용 — 행 단위 검증 */
export const catalogImportRowSchema = z.object({
  category: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(80),
  unit: z.string().trim().max(20).optional().default(""),
  default_unit_price: price.default(0),
  default_cost: price.default(0),
});

export const catalogImportSchema = z.object({
  rows: z.array(catalogImportRowSchema).min(1, "가져올 행이 없습니다.").max(2000),
});

export type CatalogItemCreateInput = z.infer<typeof catalogItemCreateSchema>;
export type CatalogItemUpdateInput = z.infer<typeof catalogItemUpdateSchema>;
export type CatalogImportRow = z.infer<typeof catalogImportRowSchema>;
