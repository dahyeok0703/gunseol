import type { Metadata } from "next";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/app-shell/empty-state";

export const metadata: Metadata = { title: "견적" };

export default function EstimatesPage() {
  return (
    <div>
      <PageHeader
        title="견적"
        description="견적가와 실행가를 나눠 마진을 관리해요."
        action={
          <Button size="sm" variant="accent" disabled>
            <Plus className="size-4" /> 새 견적
          </Button>
        }
      />
      <EmptyState
        icon={FileText}
        title="첫 견적을 만들어 보세요"
        description="항목별 견적가·실행가를 입력하면 마진이 자동으로 계산돼요."
      />
    </div>
  );
}
