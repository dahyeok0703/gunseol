"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { toggleFavoriteAction } from "@/lib/actions/catalog";

export function FavoriteToggle({ id, isFavorite }: { id: string; isFavorite: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleFavoriteAction({ id, is_favorite: !isFavorite });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
      aria-pressed={isFavorite}
      className="tap-target flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-warning disabled:opacity-50"
    >
      <Star className={cn("size-5", isFavorite && "fill-warning text-warning")} />
    </button>
  );
}
