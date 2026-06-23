import type { Metadata } from "next";
import Link from "next/link";

import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { getCompanyRow } from "@/lib/data/workspace";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app-shell/page-header";
import { CompanyForm } from "@/components/settings/company-form";

export const metadata: Metadata = { title: "업체 정보" };

export default async function CompanySettingsPage() {
  const ctx = await requireAuth();

  if (ctx.role !== "owner") {
    return (
      <div className="space-y-4">
        <PageHeader title="업체 정보" />
        <p className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
          업체 정보는 대표(owner)만 수정할 수 있어요.
        </p>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/settings">설정으로</Link>
        </Button>
      </div>
    );
  }

  const row = await getCompanyRow(ctx.workspaceId);
  const supabase = await createClient();

  async function signed(path: string | null): Promise<string | null> {
    if (!path) return null;
    const { data } = await supabase.storage.from("brand").createSignedUrl(path, 600);
    return data?.signedUrl ?? null;
  }
  const [logoPreview, stampPreview] = await Promise.all([
    signed(row?.logo_path ?? null),
    signed(row?.stamp_path ?? null),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="업체 정보" description="견적서·계약서 등 출력물에 표시돼요." />
      <CompanyForm
        workspaceId={ctx.workspaceId}
        defaultValues={{
          biz_name: row?.biz_name ?? "",
          biz_owner: row?.biz_owner ?? "",
          biz_reg_no: row?.biz_reg_no ?? "",
          biz_phone: row?.biz_phone ?? "",
          biz_address: row?.biz_address ?? "",
        }}
        initial={{
          logoPath: row?.logo_path ?? null,
          stampPath: row?.stamp_path ?? null,
          logoPreview,
          stampPreview,
        }}
      />
    </div>
  );
}
