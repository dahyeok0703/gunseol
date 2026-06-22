import type { Metadata } from "next";
import Link from "next/link";
import { Hammer, Plus } from "lucide-react";

import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { isProjectStatus } from "@/lib/constants/project";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/app-shell/empty-state";
import { StatusFilter } from "@/components/projects/status-filter";
import { ProjectCard } from "@/components/projects/project-card";

export const metadata: Metadata = { title: "현장" };

type ProjectOverview = Database["public"]["Views"]["project_overview"]["Row"];

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const ctx = await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("project_overview")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false });

  if (status && isProjectStatus(status)) {
    query = query.eq("status", status);
  }

  const { data } = await query.returns<ProjectOverview[]>();
  const projects = data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="현장"
        action={
          <Button asChild size="sm" variant="accent">
            <Link href="/sites/new">
              <Plus className="size-4" /> 새 현장
            </Link>
          </Button>
        }
      />

      <StatusFilter />

      {projects.length === 0 ? (
        <EmptyState
          icon={Hammer}
          title={status ? "해당 상태의 현장이 없어요" : "등록된 현장이 없어요"}
          description="현장을 추가하고 상태·계약·수금을 카드로 관리하세요."
          action={
            !status ? (
              <Button asChild variant="accent" size="lg">
                <Link href="/sites/new">
                  <Plus className="size-4" /> 첫 현장 추가
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
