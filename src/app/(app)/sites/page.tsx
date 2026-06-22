import type { Metadata } from "next";
import { Hammer, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/app-shell/empty-state";

export const metadata: Metadata = { title: "현장" };

export default function SitesPage() {
  return (
    <div>
      <PageHeader
        title="현장"
        description="카드로 한눈에 보는 현장 진행 상황."
        action={
          <Button size="sm" variant="accent" disabled>
            <Plus className="size-4" /> 새 현장
          </Button>
        }
      />
      <EmptyState
        icon={Hammer}
        title="등록된 현장이 없어요"
        description="현장을 추가하고 진행 상태를 카드로 관리하세요."
      />
    </div>
  );
}
