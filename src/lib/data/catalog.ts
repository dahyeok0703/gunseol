import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CatalogItem = Database["public"]["Tables"]["catalog_items"]["Row"];
export type CatalogCategory = Database["public"]["Tables"]["catalog_categories"]["Row"];

/** 견적 자동완성/선택에 쓰는 경량 품목 형태 */
export type CatalogPickerItem = Pick<
  CatalogItem,
  "id" | "category" | "name" | "unit" | "default_unit_price" | "default_cost" | "is_favorite"
>;

const PICKER_COLUMNS =
  "id, category, name, unit, default_unit_price, default_cost, is_favorite" as const;

function sanitize(q: string) {
  return q.replace(/[,()*%\\]/g, " ").trim();
}

/** 공정 카테고리 목록 (sort_order → 이름순) */
export async function getCatalogCategories(workspaceId: string): Promise<CatalogCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_categories")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .returns<CatalogCategory[]>();
  return data ?? [];
}

/** 단일 품목 (활성) */
export async function getCatalogItem(id: string): Promise<CatalogItem | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_items")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .returns<CatalogItem[]>()
    .maybeSingle();
  return data ?? null;
}

interface ListOptions {
  workspaceId: string;
  q?: string;
  category?: string;
  favoritesOnly?: boolean;
}

/**
 * 단가표 품목 조회.
 * 정렬: 즐겨찾기 우선 → 카테고리 → 이름. (견적 작성 시에도 동일 소스 사용)
 */
export async function getCatalogItems(opts: ListOptions): Promise<CatalogItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("catalog_items")
    .select("*")
    .eq("workspace_id", opts.workspaceId)
    .is("deleted_at", null)
    .order("is_favorite", { ascending: false })
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (opts.favoritesOnly) query = query.eq("is_favorite", true);
  if (opts.category) query = query.eq("category", opts.category);

  const term = opts.q ? sanitize(opts.q) : "";
  if (term) query = query.or(`name.ilike.%${term}%,category.ilike.%${term}%`);

  const { data } = await query.returns<CatalogItem[]>();
  return data ?? [];
}

/**
 * 견적 작성용 품목 소스 (자동완성/선택).
 * 견적 라인 추가 시 이 함수로 품목을 불러와 단가를 프리필한다.
 */
export async function getCatalogPickerItems(workspaceId: string): Promise<CatalogPickerItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_items")
    .select(PICKER_COLUMNS)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("is_favorite", { ascending: false })
    .order("name", { ascending: true })
    .returns<CatalogPickerItem[]>();
  return data ?? [];
}
