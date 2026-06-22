"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { catalogItemCreateSchema, type CatalogItemCreateInput } from "@/lib/validations/catalog";
import { createCatalogItemAction, updateCatalogItemAction } from "@/lib/actions/catalog";
import { calcMargin, formatKRW } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Props {
  mode: "create" | "edit";
  itemId?: string;
  categories: string[];
  defaultValues?: Partial<CatalogItemCreateInput>;
}

export function CatalogForm({ mode, itemId, categories, defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CatalogItemCreateInput>({
    resolver: zodResolver(catalogItemCreateSchema),
    defaultValues: {
      category: defaultValues?.category ?? categories[0] ?? "",
      name: defaultValues?.name ?? "",
      unit: defaultValues?.unit ?? "",
      default_unit_price: defaultValues?.default_unit_price ?? 0,
      default_cost: defaultValues?.default_cost ?? 0,
    },
  });

  const price = Number(form.watch("default_unit_price")) || 0;
  const cost = Number(form.watch("default_cost")) || 0;
  const { margin, rate } = calcMargin(price, cost);

  function onSubmit(values: CatalogItemCreateInput) {
    startTransition(async () => {
      const res =
        mode === "edit" && itemId
          ? await updateCatalogItemAction({ ...values, id: itemId })
          : await createCatalogItemAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "edit" ? "품목을 수정했어요." : "품목을 추가했어요.");
      router.replace("/catalog");
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>공정 *</FormLabel>
              <FormControl>
                <Input list="catalog-categories" placeholder="예) 도배 (선택 또는 직접 입력)" {...field} />
              </FormControl>
              <datalist id="catalog-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>품목명 *</FormLabel>
              <FormControl>
                <Input placeholder="예) 실크 도배" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>단위</FormLabel>
              <FormControl>
                <Input placeholder="㎡ / 개 / 식 / m 등" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="default_unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>견적단가</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" min={0} step={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="default_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>실행단가(원가)</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" min={0} step={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 단위당 마진 미리보기 */}
        <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
          <span className="text-sm text-muted-foreground">단위당 마진</span>
          <span className="num font-bold text-profit">
            {formatKRW(margin)} <span className="text-sm font-medium">({rate}%)</span>
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => router.back()}
            disabled={isPending}
          >
            취소
          </Button>
          <Button type="submit" variant="accent" size="lg" className="flex-1" disabled={isPending}>
            {isPending ? "저장 중…" : "저장"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
