"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { updatePasswordSchema, type UpdatePasswordInput } from "@/lib/validations/auth";
import { updatePasswordAction } from "@/lib/actions/auth";
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

export function UpdatePasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "" },
  });

  function onSubmit(values: UpdatePasswordInput) {
    startTransition(async () => {
      const res = await updatePasswordAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("비밀번호가 변경되었어요.");
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold">새 비밀번호 설정</h1>
        <p className="text-sm text-muted-foreground">새로 사용할 비밀번호를 입력해주세요.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>새 비밀번호</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="8자 이상"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            variant="accent"
            size="touch"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? "변경 중…" : "비밀번호 변경"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
