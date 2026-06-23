import { z } from "zod";

export const companySchema = z.object({
  biz_name: z.string().trim().max(60).optional().default(""),
  biz_owner: z.string().trim().max(40).optional().default(""),
  biz_reg_no: z.string().trim().max(20).optional().default(""),
  biz_phone: z.string().trim().max(30).optional().default(""),
  biz_address: z.string().trim().max(200).optional().default(""),
  logo_path: z.string().max(300).nullable().optional(),
  stamp_path: z.string().max(300).nullable().optional(),
});

export type CompanyInput = z.infer<typeof companySchema>;
