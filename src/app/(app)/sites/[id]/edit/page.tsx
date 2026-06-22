import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { PageHeader } from "@/components/app-shell/page-header";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata: Metadata = { title: "현장 수정" };

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ClientLite = Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "name">;

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireAuth();
  const supabase = await createClient();

  const [{ data: project }, { data: clientsData }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .returns<ProjectRow[]>()
      .maybeSingle(),
    supabase
      .from("clients")
      .select("id, name")
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .returns<ClientLite[]>(),
  ]);

  if (!project) notFound();

  return (
    <div>
      <PageHeader title="현장 수정" />
      <ProjectForm
        mode="edit"
        projectId={id}
        clients={clientsData ?? []}
        defaultValues={{
          client_id: project.client_id ?? "",
          name: project.name,
          site_address: project.site_address ?? "",
          status: project.status,
          memo: project.memo ?? "",
        }}
      />
    </div>
  );
}
