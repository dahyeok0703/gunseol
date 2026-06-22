"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { resetRequestSchema, type ResetRequestInput } from "@/lib/validations/auth";
import { resetRequestAction } from "@/lib/actions/auth";
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

export function ResetRequestForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const form = useForm<ResetRequestInput>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ResetRequestInput) {
    startTransition(async () => {
      const res = await resetRequestAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSent(true);
      toast.success("재설정 메일을 보냈어요.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold">비밀번호 재설정</h1>
        <p className="text-sm text-muted-foreground">
          가입한 이메일로 재설정 링크를 보내드려요.
        </p>
      </div>

      {sent ? (
        <div className="rounded-lg border border-border bg-card p-4 text-center text-sm">
          메일함을 확인하고 링크를 눌러 새 비밀번호를 설정해주세요.
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
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
              {isPending ? "보내는 중…" : "재설정 링크 받기"}
            </Button>
          </form>
        </Form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
