import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Phone, MapPin, StickyNote, Hammer, Plus, ChevronRight } from "lucide-react";

import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app-shell/page-header";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { EntityDeleteButton } from "@/components/entity-delete-button";

export const metadata: Metadata = { title: "거래처 상세" };

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ProjectOverview = Database["public"]["Views"]["project_overview"]["Row"];

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAuth();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .returns<ClientRow[]>()
    .maybeSingle();

  if (!client) notFound();

  const { data: projectsData } = await supabase
    .from("project_overview")
    .select("id, name, status, site_address")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .returns<Pick<ProjectOverview, "id" | "name" | "status" | "site_address">[]>();

  const projects = projectsData ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title={client.name}
        action={
          <Button asChild size="sm" variant="outline">
            <Link href={`/clients/${id}/edit`}>
              <Pencil className="size-4" /> 수정
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-4">
          <InfoRow icon={Phone} label="연락처" value={client.phone} href={client.phone ? `tel:${client.phone}` : undefined} />
          <InfoRow icon={MapPin} label="주소" value={client.address} />
          <InfoRow icon={StickyNote} label="메모" value={client.memo} multiline />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">연결된 현장 ({projects.length})</h2>
          <Button asChild size="sm" variant="ghost">
            <Link href={{ pathname: "/sites/new", query: { client: id } }}>
              <Plus className="size-4" /> 현장 추가
            </Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
            <Hammer className="mx-auto mb-2 size-5" />
            아직 연결된 현장이 없어요.
          </div>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link href={`/sites/${p.id}`} className="block">
                  <Card className="flex items-center justify-between gap-3 p-3 transition-colors active:bg-secondary/50">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      {p.site_address ? (
                        <p className="truncate text-xs text-muted-foreground">{p.site_address}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <ProjectStatusBadge status={p.status} />
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="pt-2">
        <EntityDeleteButton kind="client" id={id} redirectTo="/clients" label="거래처" />
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  multiline,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
  href?: string;
  multiline?: boolean;
}) {
  const content = value || <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href && value ? (
          <a href={href} className="font-medium text-foreground underline-offset-4 hover:underline">
            {value}
          </a>
        ) : (
          <p className={multiline ? "whitespace-pre-wrap font-medium" : "truncate font-medium"}>
            {content}
          </p>
        )}
      </div>
    </div>
  );
}
