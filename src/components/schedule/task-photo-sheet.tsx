"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { createTaskPhotoAction, deleteTaskPhotoAction } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

interface PhotoView {
  id: string;
  file_path: string;
  caption: string | null;
  url: string | null;
}

export function TaskPhotoSheet({
  open,
  task,
  workspaceId,
  onClose,
}: {
  open: boolean;
  task: { id: string; name: string; project_id: string } | null;
  workspaceId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoView[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !task) return;
    let active = true;
    setLoading(true);
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("task_photos")
        .select("id, file_path, caption")
        .eq("task_id", task.id)
        .order("created_at", { ascending: false });
      const rows = data ?? [];
      const withUrls = await Promise.all(
        rows.map(async (r) => {
          const { data: signed } = await supabase.storage
            .from("site")
            .createSignedUrl(r.file_path, 600);
          return { ...r, url: signed?.signedUrl ?? null };
        }),
      );
      if (active) {
        setPhotos(withUrls);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, task]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !task) return;
    if (!EXT[file.type]) {
      toast.error("PNG/JPG/WEBP 사진만 가능해요.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("사진이 너무 커요. (최대 8MB)");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const path = `${workspaceId}/${task.id}/${Date.now()}.${EXT[file.type]}`;
      const { error } = await supabase.storage
        .from("site")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      startTransition(async () => {
        const res = await createTaskPhotoAction({
          task_id: task.id,
          project_id: task.project_id,
          file_path: path,
          caption: "",
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        const { data: signed } = await supabase.storage.from("site").createSignedUrl(path, 600);
        setPhotos((prev) => [
          { id: crypto.randomUUID(), file_path: path, caption: null, url: signed?.signedUrl ?? null },
          ...prev,
        ]);
        router.refresh();
      });
    } catch {
      toast.error("사진 업로드에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteTaskPhotoAction({ id });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    });
  }

  if (!open || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background pt-safe">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">현장 사진</p>
          <p className="truncate font-semibold">{task.name}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="닫기" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          capture="environment"
          className="hidden"
          onChange={onFile}
        />
        {photos.length === 0 && !loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            아직 사진이 없어요. 현장 사진을 첨부해보세요.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="relative">
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.url}
                    alt={p.caption ?? "현장 사진"}
                    className="aspect-square w-full rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
                )}
                <button
                  type="button"
                  aria-label="사진 삭제"
                  onClick={() => remove(p.id)}
                  className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3 pb-safe">
        <Button
          type="button"
          variant="accent"
          size="touch"
          className="w-full"
          disabled={loading}
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="size-4" /> {loading ? "처리 중…" : "사진 추가"}
        </Button>
      </div>
    </div>
  );
}
