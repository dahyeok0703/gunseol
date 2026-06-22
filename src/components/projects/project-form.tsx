"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { projectCreateSchema, type ProjectCreateInput } from "@/lib/validations/project";
import { createProjectAction, updateProjectAction } from "@/lib/actions/projects";
import { PROJECT_STATUS_ORDER, projectStatusMeta } from "@/lib/constants/project";
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

const selectClass =
  "flex h-12 w-full rounded-md border border-input bg-card px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Props {
  mode: "create" | "edit";
  projectId?: string;
  clients: { id: string; name: string }[];
  defaultValues?: Partial<ProjectCreateInput>;
}

export function ProjectForm({ mode, projectId, clients, defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProjectCreateInput>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: {
      client_id: defaultValues?.client_id ?? clients[0]?.id ?? "",
      name: defaultValues?.name ?? "",
      site_address: defaultValues?.site_address ?? "",
      status: defaultValues?.status ?? "estimating",
      memo: defaultValues?.memo ?? "",
    },
  });

  function onSubmit(values: ProjectCreateInput) {
    startTransition(async () => {
      const res =
        mode === "edit" && projectId
          ? await updateProjectAction({ ...values, id: projectId })
          : await createProjectAction(values);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "edit" ? "현장을 수정했어요." : "현장을 추가했어요.");
      router.replace(`/sites/${res.data.id}`);
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>거래처 *</FormLabel>
              <FormControl>
                <select className={selectClass} {...field}>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>현장명 *</FormLabel>
              <FormControl>
                <Input placeholder="예) 강남 OO아파트 32평 올수리" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="site_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>현장 주소</FormLabel>
              <FormControl>
                <Input placeholder="현장 주소" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상태</FormLabel>
              <FormControl>
                <select className={selectClass} {...field}>
                  {PROJECT_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {projectStatusMeta[s].label}
                    </option>
                  ))}
                </select>
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
                <Textarea rows={4} placeholder="현장 특이사항, 일정 등" {...field} />
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
