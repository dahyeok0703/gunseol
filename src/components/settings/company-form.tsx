"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Upload, X, ImageIcon, Stamp } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { companySchema, type CompanyInput } from "@/lib/validations/company";
import { updateCompanyAction } from "@/lib/actions/company";
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

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

interface Props {
  workspaceId: string;
  defaultValues: Pick<
    CompanyInput,
    "biz_name" | "biz_owner" | "biz_reg_no" | "biz_phone" | "biz_address"
  >;
  initial: {
    logoPath: string | null;
    stampPath: string | null;
    logoPreview: string | null;
    stampPreview: string | null;
  };
}

export function CompanyForm({ workspaceId, defaultValues, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [assets, setAssets] = useState({
    logoPath: initial.logoPath,
    stampPath: initial.stampPath,
    logoPreview: initial.logoPreview,
    stampPreview: initial.stampPreview,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);

  const form = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      biz_name: defaultValues.biz_name ?? "",
      biz_owner: defaultValues.biz_owner ?? "",
      biz_reg_no: defaultValues.biz_reg_no ?? "",
      biz_phone: defaultValues.biz_phone ?? "",
      biz_address: defaultValues.biz_address ?? "",
    },
  });

  function pick(kind: "logo" | "stamp", file: File | null) {
    if (!file) return;
    if (!EXT[file.type]) {
      toast.error("PNG/JPG/WEBP 이미지만 가능해요.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("이미지가 너무 커요. (최대 4MB)");
      return;
    }
    const preview = URL.createObjectURL(file);
    if (kind === "logo") {
      setLogoFile(file);
      setAssets((a) => ({ ...a, logoPreview: preview }));
    } else {
      setStampFile(file);
      setAssets((a) => ({ ...a, stampPreview: preview }));
    }
  }

  function clear(kind: "logo" | "stamp") {
    if (kind === "logo") {
      setLogoFile(null);
      setAssets((a) => ({ ...a, logoPath: null, logoPreview: null }));
    } else {
      setStampFile(null);
      setAssets((a) => ({ ...a, stampPath: null, stampPreview: null }));
    }
  }

  async function uploadIfNeeded(kind: "logo" | "stamp", file: File | null, current: string | null) {
    if (!file) return current;
    const supabase = createClient();
    const ext = EXT[file.type] ?? "png";
    const path = `${workspaceId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("brand")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw new Error(`${kind} 업로드 실패`);
    return path;
  }

  function onSubmit(values: CompanyInput) {
    startTransition(async () => {
      let logoPath = assets.logoPath;
      let stampPath = assets.stampPath;
      try {
        logoPath = await uploadIfNeeded("logo", logoFile, assets.logoPath);
        stampPath = await uploadIfNeeded("stamp", stampFile, assets.stampPath);
      } catch {
        toast.error("이미지 업로드에 실패했어요.");
        return;
      }

      const res = await updateCompanyAction({ ...values, logo_path: logoPath, stamp_path: stampPath });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("업체 정보를 저장했어요.");
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="biz_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상호 (업체명)</FormLabel>
              <FormControl>
                <Input placeholder="예) 든든인테리어" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="biz_owner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>대표자</FormLabel>
                <FormControl>
                  <Input placeholder="홍길동" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="biz_reg_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사업자등록번호</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="000-00-00000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="biz_phone"
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
          name="biz_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>주소</FormLabel>
              <FormControl>
                <Input placeholder="사업장 주소" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 로고 · 도장 */}
        <div className="grid grid-cols-2 gap-3">
          <AssetField
            label="로고"
            icon={ImageIcon}
            preview={assets.logoPreview}
            onPick={(f) => pick("logo", f)}
            onClear={() => clear("logo")}
          />
          <AssetField
            label="도장"
            icon={Stamp}
            preview={assets.stampPreview}
            onPick={(f) => pick("stamp", f)}
            onClear={() => clear("stamp")}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          로고·도장은 견적서·계약서 등 출력물에 표시됩니다. (PNG/JPG/WEBP, 최대 4MB)
        </p>

        <Button type="submit" variant="accent" size="touch" className="w-full" disabled={isPending}>
          {isPending ? "저장 중…" : "저장"}
        </Button>
      </form>
    </Form>
  );
}

function AssetField({
  label,
  icon: Icon,
  preview,
  onPick,
  onClear,
}: {
  label: string;
  icon: typeof ImageIcon;
  preview: string | null;
  onPick: (file: File | null) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={label}
            className="h-24 w-full rounded-lg border border-border bg-card object-contain p-2"
          />
          <button
            type="button"
            aria-label={`${label} 삭제`}
            onClick={onClear}
            className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-secondary"
        >
          <Icon className="size-5" />
          <span className="inline-flex items-center gap-1">
            <Upload className="size-3" /> 업로드
          </span>
        </button>
      )}
    </div>
  );
}
