"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, FileSignature, ClipboardList } from "lucide-react";

import { cn, formatKRW } from "@/lib/utils";
import { statementCreateSchema, type StatementCreateInput } from "@/lib/validations/statement";
import { createStatementAction, deleteStatementAction } from "@/lib/actions/statements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PdfActions } from "@/components/documents/pdf-actions";
import type { Statement } from "@/lib/data/statements";

const selectClass =
  "h-11 w-full rounded-md border border-input bg-card px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const today = () => new Date().toISOString().slice(0, 10);

export function StatementsSection({
  projectId,
  statements,
}: {
  projectId: string;
  statements: Statement[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<StatementCreateInput>({
    resolver: zodResolver(statementCreateSchema),
    defaultValues: {
      project_id: projectId,
      type: "purchase_order",
      vendor: "",
      amount: 0,
      issued_on: today(),
      memo: "",
    },
  });

  function onSubmit(values: StatementCreateInput) {
    startTransition(async () => {
      const res = await createStatementAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("저장했어요.");
      form.reset({ project_id: projectId, type: values.type, vendor: "", amount: 0, issued_on: today(), memo: "" });
      setOpen(false);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteStatementAction({ id });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("삭제했어요.");
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">발주서 · 거래명세서</h3>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          <Plus className="size-4" /> 추가
        </Button>
      </div>

      {open ? (
        <Card className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>종류</FormLabel>
                    <FormControl>
                      <select className={selectClass} {...field}>
                        <option value="purchase_order">발주서</option>
                        <option value="trade_statement">거래명세서</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>거래처 / 공급처</FormLabel>
                    <FormControl>
                      <Input placeholder="예) OO자재" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>금액</FormLabel>
                      <FormControl>
                        <Input type="number" inputMode="numeric" min={0} step={1000} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="issued_on"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>일자</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>메모</FormLabel>
                    <FormControl>
                      <Input placeholder="품목/비고 (선택)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full"
                disabled={isPending}
              >
                저장
              </Button>
            </form>
          </Form>
        </Card>
      ) : null}

      {statements.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
          발주서·거래명세서를 추가하면 PDF로 출력할 수 있어요.
        </p>
      ) : (
        <ul className="space-y-2">
          {statements.map((s) => {
            const isPO = s.type === "purchase_order";
            return (
              <li key={s.id}>
                <Card className="space-y-2 p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        isPO ? "bg-blue-100 text-blue-700" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {isPO ? (
                        <ClipboardList className="size-3" />
                      ) : (
                        <FileSignature className="size-3" />
                      )}
                      {isPO ? "발주서" : "거래명세서"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {s.vendor ?? "—"}
                    </span>
                    <span className="num text-sm font-bold">{formatKRW(Number(s.amount))}</span>
                    <button
                      type="button"
                      aria-label="삭제"
                      onClick={() => remove(s.id)}
                      disabled={isPending}
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground">{s.issued_on ?? ""}</span>
                    <PdfActions
                      url={`/api/pdf/statement/${s.id}`}
                      title={`${isPO ? "발주서" : "거래명세서"} ${s.vendor ?? ""}`}
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
