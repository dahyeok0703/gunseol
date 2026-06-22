import type { Metadata } from "next";
import Link from "next/link";
import { Users, Plus, Phone, ChevronRight } from "lucide-react";

import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/app-shell/empty-state";
import { ClientSearch } from "@/components/clients/client-search";

export const metadata: Metadata = { title: "거래처" };

type ClientRow = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  "id" | "name" | "phone" | "address"
>;

// PostgREST or() 필터를 깨는 문자 제거 (간단한 살균)
function sanitize(q: string) {
  return q.replace(/[,()*%\\]/g, " ").trim();
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const ctx = await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("id, name, phone, address")
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const term = q ? sanitize(q) : "";
  if (term) {
    query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,address.ilike.%${term}%`);
  }

  const { data } = await query.returns<ClientRow[]>();
  const clients = data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="거래처"
        action={
          <Button asChild size="sm" variant="accent">
            <Link href="/clients/new">
              <Plus className="size-4" /> 새 거래처
            </Link>
          </Button>
        }
      />

      <ClientSearch />

      {clients.length === 0 ? (
        term ? (
          <EmptyState
            icon={Users}
            title="검색 결과가 없어요"
            description={`'${term}' 와(과) 일치하는 거래처가 없습니다.`}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="등록된 거래처가 없어요"
            description="거래처를 추가하면 현장·견적에 바로 연결할 수 있어요."
            action={
              <Button asChild variant="accent" size="lg">
                <Link href="/clients/new">
                  <Plus className="size-4" /> 첫 거래처 추가
                </Link>
              </Button>
            }
          />
        )
      ) : (
        <ul className="space-y-2">
          {clients.map((c) => (
            <li key={c.id}>
              <Link href={`/clients/${c.id}`} className="block">
                <Card className="flex items-center justify-between gap-3 p-4 transition-colors active:bg-secondary/50">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {c.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" /> {c.phone}
                        </span>
                      ) : null}
                      {c.address ? <span className="truncate">{c.address}</span> : null}
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
