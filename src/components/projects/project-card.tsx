import Link from "next/link";
import { ChevronRight, MapPin, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { formatKRW } from "@/lib/utils";
import type { Database } from "@/types/database";

type ProjectOverview = Database["public"]["Views"]["project_overview"]["Row"];

export function ProjectCard({ project }: { project: ProjectOverview }) {
  return (
    <Link href={`/sites/${project.id}`} className="block">
      <Card className="p-4 transition-colors active:bg-secondary/50">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-semibold">{project.name}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {project.client_name ? (
                <span className="inline-flex items-center gap-1">
                  <User className="size-3" /> {project.client_name}
                </span>
              ) : null}
              {project.site_address ? (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{project.site_address}</span>
                </span>
              ) : null}
            </div>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        <div className="mt-3 flex items-end justify-between gap-3 border-t border-border pt-3">
          <div>
            <p className="text-[11px] text-muted-foreground">계약금액</p>
            <p className="num text-base font-bold">{formatKRW(project.contract_amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">받을 돈</p>
            <p className="num text-base font-bold text-warning">
              {formatKRW(project.receivable)}
            </p>
          </div>
          <ChevronRight className="mb-0.5 size-5 shrink-0 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  );
}
