import type { Metadata } from "next";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/app-shell/empty-state";

export const metadata: Metadata = { title: "거래처" };

export default function ClientsPage() {
  return (
    <div>
      <PageHeader
        title="거래처"
        description="고객·협력업체 연락처를 한 곳에서."
        action={
          <Button size="sm" variant="accent" disabled>
            <Plus className="size-4" /> 새 거래처
          </Button>
        }
      />
      <EmptyState
        icon={Users}
        title="등록된 거래처가 없어요"
        description="거래처를 추가하면 견적·현장에 바로 연결할 수 있어요."
      />
    </div>
  );
}
