import type { Metadata } from "next";
import Link from "next/link";
import { Users, Plus } from "lucide-react";

import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/app-shell/empty-state";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata: Metadata = { title: "새 현장" };

type ClientLite = Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "name">;

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const ctx = await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("id, name")
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .returns<ClientLite[]>();

  const clients = data ?? [];

  return (
    <div>
      <PageHeader title="새 현장" description="현장은 거래처에 연결됩니다." />
      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="먼저 거래처가 필요해요"
          description="현장은 거래처에 연결되므로, 거래처를 먼저 등록해주세요."
          action={
            <Button asChild variant="accent" size="lg">
              <Link href="/clients/new">
                <Plus className="size-4" /> 거래처 추가
              </Link>
            </Button>
          }
        />
      ) : (
        <ProjectForm
          mode="create"
          clients={clients}
          defaultValues={client ? { client_id: client } : undefined}
        />
      )}
    </div>
  );
}
