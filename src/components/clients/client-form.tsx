"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { clientCreateSchema, type ClientCreateInput } from "@/lib/validations/client";
import { createClientAction, updateClientAction } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  clientId?: string;
  defaultValues?: Partial<ClientCreateInput>;
}

export function ClientForm({ mode, clientId, defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClientCreateInput>({
    resolver: zodResolver(clientCreateSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      phone: defaultValues?.phone ?? "",
      address: defaultValues?.address ?? "",
      memo: defaultValues?.memo ?? "",
    },
  });

  function onSubmit(values: ClientCreateInput) {
    startTransition(async () => {
      const res =
        mode === "edit" && clientId
          ? await updateClientAction({ ...values, id: clientId })
          : await createClientAction(values);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "edit" ? "거래처를 수정했어요." : "거래처를 추가했어요.");
      router.replace(`/clients/${res.data.id}`);
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>거래처명 *</FormLabel>
              <FormControl>
                <Input placeholder="예) 김철수 / OO건설" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>연락처</FormLabel>
              <FormControl>
                <Input type="tel" inputMode="tel" placeholder="010-0000-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>주소</FormLabel>
              <FormControl>
                <Input placeholder="현장/사무실 주소" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="특이사항, 소개 경로 등" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
