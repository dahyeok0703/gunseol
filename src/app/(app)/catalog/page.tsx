import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Plus, Pencil } from "lucide-react";

import { requireAuth } from "@/lib/auth/context";
import { getCatalogCategories, getCatalogItems, type CatalogItem } from "@/lib/data/catalog";
import { calcMargin, formatKRW } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/app-shell/empty-state";
import { CatalogToolbar } from "@/components/catalog/catalog-toolbar";
import { CatalogExcel } from "@/components/catalog/catalog-excel";
import { FavoriteToggle } from "@/components/catalog/favorite-toggle";

export const metadata: Metadata = { title: "단가표" };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; fav?: string }>;
}) {
  const { q, cat, fav } = await searchParams;
  const ctx = await requireAuth();

  const [categories, allItems, items] = await Promise.all([
    getCatalogCategories(ctx.workspaceId),
    getCatalogItems({ workspaceId: ctx.workspaceId }),
    getCatalogItems({
      workspaceId: ctx.workspaceId,
      q,
      category: cat,
      favoritesOnly: fav === "1",
    }),
  ]);

  const hasFilter = Boolean(q || cat || fav === "1");

  // 카테고리별 그룹화 (카테고리 정의 순서 → 기타)
  const order = categories.map((c) => c.name);
  const groups = new Map<string, CatalogItem[]>();
  for (const it of items) {
    const key = it.category ?? "미분류";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }
  const groupKeys = Array.from(groups.keys()).sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="단가표"
        description="견적 작성의 기반이 되는 나만의 공정·품목 단가."
        action={
          <Button asChild size="sm" variant="accent">
            <Link href="/catalog/new">
              <Plus className="size-4" /> 새 품목
            </Link>
          </Button>
        }
      />

      <CatalogExcel items={allItems} />

      {allItems.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="아직 단가가 비어있어요"
          description="기본 공정 카테고리는 준비해 뒀어요. 품목과 단가는 직접 채워주세요. 엑셀로 한 번에 가져올 수도 있어요."
          action={
            <Button asChild variant="accent" size="lg">
              <Link href="/catalog/new">
                <Plus className="size-4" /> 첫 품목 추가
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <CatalogToolbar categories={categories.map((c) => c.name)} />

          {items.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="결과가 없어요"
              description={hasFilter ? "검색·필터 조건과 일치하는 품목이 없습니다." : "품목을 추가해보세요."}
            />
          ) : (
            <div className="space-y-5">
              {groupKeys.map((key) => (
                <section key={key} className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-semibold">{key}</h2>
                    <span className="text-xs text-muted-foreground">{groups.get(key)!.length}</span>
                  </div>
                  <ul className="space-y-2">
                    {groups.get(key)!.map((it) => (
                      <li key={it.id}>
                        <CatalogRow item={it} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CatalogRow({ item }: { item: CatalogItem }) {
  const { margin, rate } = calcMargin(item.default_unit_price, item.default_cost);
  return (
    <Card className="flex items-center gap-2 p-3">
      <FavoriteToggle id={item.id} isFavorite={item.is_favorite} />

      <Link href={`/catalog/${item.id}/edit`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            견적 {formatKRW(item.default_unit_price)} · 실행 {formatKRW(item.default_cost)}
            {item.unit ? ` · ${item.unit}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="num text-sm font-bold text-profit">{formatKRW(margin)}</p>
          <p className="text-[11px] text-muted-foreground">마진 {rate}%</p>
        </div>
        <Pencil className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </Card>
  );
}
