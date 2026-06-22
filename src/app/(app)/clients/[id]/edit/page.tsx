import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { PageHeader } from "@/components/app-shell/page-header";
import { ClientForm } from "@/components/clients/client-form";

export const metadata: Metadata = { title: "거래처 수정" };

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div>
      <PageHeader title="거래처 수정" />
      <ClientForm
        mode="edit"
        clientId={id}
        defaultValues={{
          name: client.name,
          phone: client.phone ?? "",
          address: client.address ?? "",
          memo: client.memo ?? "",
        }}
      />
    </div>
  );
}
