import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다.");

export const taskCreateSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().trim().min(1, "공정명을 입력해주세요.").max(80),
  due_on: dateStr.optional().nullable(),
});

export const taskUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  due_on: dateStr.optional().nullable(),
});

export const taskToggleSchema = z.object({
  id: z.string().uuid(),
  done: z.boolean(),
});

export const taskReorderSchema = z.object({
  project_id: z.string().uuid(),
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export const taskIdSchema = z.object({ id: z.string().uuid() });

export const taskPhotoCreateSchema = z.object({
  task_id: z.string().uuid(),
  project_id: z.string().uuid(),
  file_path: z.string().min(1).max(300),
  caption: z.string().trim().max(120).optional().default(""),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
