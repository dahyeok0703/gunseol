import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/context";
import { PageHeader } from "@/components/app-shell/page-header";
import { ClientForm } from "@/components/clients/client-form";

export const metadata: Metadata = { title: "새 거래처" };

export default async function NewClientPage() {
  await requireAuth();
  return (
    <div>
      <PageHeader title="새 거래처" description="거래처 정보를 입력하세요." />
      <ClientForm mode="create" />
    </div>
  );
}
