"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/context";
import { action, ActionError } from "@/lib/actions/safe-action";
import {
  catalogItemCreateSchema,
  catalogItemUpdateSchema,
  catalogIdSchema,
  favoriteSchema,
  catalogImportSchema,
} from "@/lib/validations/catalog";

const nn = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

/** 새 카테고리면 catalog_categories 에 추가(있으면 무시) */
async function ensureCategories(workspaceId: string, names: string[]) {
  const supabase = await createClient();
  const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  if (unique.length === 0) return;
  await supabase
    .from("catalog_categories")
    .upsert(
      unique.map((name) => ({ workspace_id: workspaceId, name })),
      { onConflict: "workspace_id,name", ignoreDuplicates: true },
    );
}

export const createCatalogItemAction = action(catalogItemCreateSchema, async (input) => {
  const ctx = await requireAuth();
  const supabase = await createClient();

  await ensureCategories(ctx.workspaceId, [input.category]);

  const { data, error } = await supabase
    .from("catalog_items")
    .insert({
      workspace_id: ctx.workspaceId,
      category: input.category,
      name: input.name,
      unit: nn(input.unit),
      default_unit_price: input.default_unit_price,
      default_cost: input.default_cost,
    })
    .select("id")
    .returns<{ id: string }[]>()
    .single();

  if (error || !data) throw new ActionError("품목 저장에 실패했습니다.");
  revalidatePath("/catalog");
  return { id: data.id };
});

export const updateCatalogItemAction = action(catalogItemUpdateSchema, async (input) => {
  const ctx = await requireAuth();
  const supabase = await createClient();

  await ensureCategories(ctx.workspaceId, [input.category]);

  const { error } = await supabase
    .from("catalog_items")
    .update({
      category: input.category,
      name: input.name,
      unit: nn(input.unit),
      default_unit_price: input.default_unit_price,
      default_cost: input.default_cost,
    })
    .eq("id", input.id)
    .is("deleted_at", null);

  if (error) throw new ActionError("품목 수정에 실패했습니다.");
  revalidatePath("/catalog");
  return { id: input.id };
});

/** soft delete */
export const deleteCatalogItemAction = action(catalogIdSchema, async ({ id }) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("catalog_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new ActionError("품목 삭제에 실패했습니다.");
  revalidatePath("/catalog");
  return { id };
});

/** 즐겨찾기 토글 */
export const toggleFavoriteAction = action(favoriteSchema, async ({ id, is_favorite }) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("catalog_items")
    .update({ is_favorite })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new ActionError("즐겨찾기 변경에 실패했습니다.");
  revalidatePath("/catalog");
  return { id, is_favorite };
});

/** 엑셀 일괄 등록 */
export const importCatalogAction = action(catalogImportSchema, async ({ rows }) => {
  const ctx = await requireAuth();
  const supabase = await createClient();

  await ensureCategories(
    ctx.workspaceId,
    rows.map((r) => r.category),
  );

  const { error, count } = await supabase.from("catalog_items").insert(
    rows.map((r) => ({
      workspace_id: ctx.workspaceId,
      category: r.category,
      name: r.name,
      unit: nn(r.unit),
      default_unit_price: r.default_unit_price,
      default_cost: r.default_cost,
    })),
    { count: "exact" },
  );

  if (error) throw new ActionError("엑셀 가져오기에 실패했습니다.");
  revalidatePath("/catalog");
  return { inserted: count ?? rows.length };
});
