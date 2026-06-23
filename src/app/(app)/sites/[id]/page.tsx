import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil,
  User,
  MapPin,
  StickyNote,
  FileText,
  Wallet,
  Plus,
  ChevronRight,
} from "lucide-react";

import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { getProjectEstimates, type Estimate } from "@/lib/data/estimates";
import { getProjectStatements, type Statement } from "@/lib/data/statements";
import { getProjectTasks, getProjectPhotoCounts } from "@/lib/data/tasks";
import { formatKRW, calcMargin } from "@/lib/utils";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app-shell/page-header";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { StatusChanger } from "@/components/projects/status-changer";
import { EstimateStatusBadge } from "@/components/estimates/estimate-status-badge";
import { EntityDeleteButton } from "@/components/entity-delete-button";
import { PdfActions } from "@/components/documents/pdf-actions";
import { StatementsSection } from "@/components/documents/statements-section";
import { ScheduleSection } from "@/components/schedule/schedule-section";

export const metadata: Metadata = { title: "현장 상세" };

type ProjectOverview = Database["public"]["Views"]["project_overview"]["Row"];

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireAuth();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("project_overview")
    .select("*")
    .eq("id", id)
    .returns<ProjectOverview[]>()
    .maybeSingle();

  if (!project) notFound();

  const [estimates, statements, tasks, photoCounts] = await Promise.all([
    getProjectEstimates(id),
    getProjectStatements(id),
    getProjectTasks(id),
    getProjectPhotoCounts(id),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={project.name}
        action={
          <Button asChild size="sm" variant="outline">
            <Link href={`/sites/${id}/edit`}>
              <Pencil className="size-4" /> 수정
            </Link>
          </Button>
        }
      />

      {/* 금액 요약 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="space-y-0.5 p-4">
            <p className="text-xs text-muted-foreground">계약금액</p>
            <p className="num text-xl font-bold">{formatKRW(project.contract_amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-0.5 p-4">
            <p className="text-xs text-muted-foreground">받을 돈</p>
            <p className="num text-xl font-bold text-warning">{formatKRW(project.receivable)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 상태 전환 */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">진행 상태</p>
            <ProjectStatusBadge status={project.status} />
          </div>
          <StatusChanger projectId={id} status={project.status} />
        </CardContent>
      </Card>

      {/* 기본 정보 */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <InfoRow
            icon={User}
            label="거래처"
            value={project.client_name}
            href={project.client_id ? (`/clients/${project.client_id}` as Route) : undefined}
          />
          <InfoRow icon={MapPin} label="현장 주소" value={project.site_address} />
          <InfoRow icon={StickyNote} label="메모" value={project.memo} multiline />
        </CardContent>
      </Card>

      {/* 탭 — 내용은 다음 스테이지 연결점 */}
      <Tabs defaultValue="estimate">
        <TabsList>
          <TabsTrigger value="estimate">견적</TabsTrigger>
          <TabsTrigger value="contract">계약·출력물</TabsTrigger>
          <TabsTrigger value="schedule">일정</TabsTrigger>
          <TabsTrigger value="payment">수금</TabsTrigger>
        </TabsList>
        <TabsContent value="estimate">
          <EstimateTab projectId={id} estimates={estimates} />
        </TabsContent>
        <TabsContent value="contract">
          <DocsTab projectId={id} estimates={estimates} statements={statements} />
        </TabsContent>
        <TabsContent value="schedule">
          <ScheduleSection
            projectId={id}
            workspaceId={ctx.workspaceId}
            tasks={tasks}
            photoCounts={photoCounts}
          />
        </TabsContent>
        <TabsContent value="payment">
          <TabPlaceholder
            icon={Wallet}
            title="수금"
            description="계약금·중도금·잔금 등 받을 돈을 추적합니다."
          />
        </TabsContent>
      </Tabs>

      <div className="pt-2">
        <EntityDeleteButton kind="project" id={id} redirectTo="/sites" label="현장" />
      </div>
    </div>
  );
}

function EstimateTab({ projectId, estimates }: { projectId: string; estimates: Estimate[] }) {
  return (
    <div className="space-y-3">
      <Button asChild variant="accent" size="touch" className="w-full">
        <Link href={`/sites/${projectId}/estimates/new`}>
          <Plus className="size-4" /> 새 견적 작성
        </Link>
      </Button>

      {estimates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
          아직 견적이 없어요. 단가표에서 품목을 골라 빠르게 작성해보세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {estimates.map((e) => {
            const { margin, rate } = calcMargin(e.total_price, e.total_cost);
            const loss = margin < 0;
            return (
              <li key={e.id}>
                <Link href={`/sites/${projectId}/estimates/${e.id}`} className="block">
                  <Card className="flex items-center gap-3 p-3 transition-colors active:bg-secondary/50">
                    <span className="num text-sm font-semibold text-muted-foreground">
                      v{e.version}
                    </span>
                    <EstimateStatusBadge status={e.status} />
                    <span className="num ml-auto text-sm font-bold">
                      {formatKRW(e.total_price)}
                    </span>
                    <span className={`num text-xs font-semibold ${loss ? "text-loss" : "text-profit"}`}>
                      {rate}%
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DocsTab({
  projectId,
  estimates,
  statements,
}: {
  projectId: string;
  estimates: Estimate[];
  statements: Statement[];
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">견적서 · 계약서</h3>
        {estimates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
            견적을 작성하면 견적서·계약서를 PDF로 출력할 수 있어요.
          </p>
        ) : (
          <ul className="space-y-2">
            {estimates.map((e) => (
              <li key={e.id}>
                <Card className="space-y-2 p-3">
                  <div className="flex items-center gap-2">
                    <span className="num text-sm font-semibold">견적 v{e.version}</span>
                    <EstimateStatusBadge status={e.status} />
                    <span className="num ml-auto text-sm font-bold">
                      {formatKRW(e.total_price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground">견적서</span>
                    <PdfActions url={`/api/pdf/estimate/${e.id}`} title={`견적서 v${e.version}`} />
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground">계약서 (법무 검토 필요)</span>
                    <PdfActions url={`/api/pdf/contract/${e.id}`} title={`계약서 v${e.version}`} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StatementsSection projectId={projectId} statements={statements} />
    </div>
  );
}

function TabPlaceholder({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <span className="mt-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
        다음 단계에서 연결됩니다
      </span>
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
  icon: typeof User;
  label: string;
  value: string | null;
  href?: Route;
  multiline?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href && value ? (
          <Link href={href} className="font-medium underline-offset-4 hover:underline">
            {value}
          </Link>
        ) : (
          <p className={multiline ? "whitespace-pre-wrap font-medium" : "truncate font-medium"}>
            {value || <span className="text-muted-foreground">—</span>}
          </p>
        )}
      </div>
    </div>
  );
}
