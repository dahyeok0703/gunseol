"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Route } from "next";

import { deleteClientAction } from "@/lib/actions/clients";
import { deleteProjectAction } from "@/lib/actions/projects";
import { deleteCatalogItemAction } from "@/lib/actions/catalog";
import { Button } from "@/components/ui/button";

const deleteActions = {
  client: deleteClientAction,
  project: deleteProjectAction,
  catalog: deleteCatalogItemAction,
} as const;

/**
 * soft delete 버튼 (2단계 확인).
 * 거래처/현장 상세에서 사용한다.
 */
export function EntityDeleteButton({
  kind,
  id,
  redirectTo,
  label,
}: {
  kind: keyof typeof deleteActions;
  id: string;
  redirectTo: Route;
  label: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await deleteActions[kind]({ id });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${label}을(를) 삭제했어요.`);
      router.replace(redirectTo);
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="lg"
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-4" /> {label} 삭제
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="flex-1"
        onClick={() => setConfirming(false)}
        disabled={isPending}
      >
        취소
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="lg"
        className="flex-1"
        onClick={onDelete}
        disabled={isPending}
      >
        {isPending ? "삭제 중…" : "삭제 확정"}
      </Button>
    </div>
  );
}
