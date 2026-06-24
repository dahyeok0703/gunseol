import { Check } from "lucide-react";
import { cn, formatKRW } from "@/lib/utils";
import { PLAN_LIMITS, PRO_PRICE_KRW } from "@/lib/constants/plan";

const rows = [
  {
    label: "현장 개수",
    free: `${PLAN_LIMITS.free.maxProjects}개`,
    pro: "무제한",
  },
  {
    label: "월 AI 항목 추출",
    free: `${PLAN_LIMITS.free.aiExtractions}회`,
    pro: `${PLAN_LIMITS.pro.aiExtractions.toLocaleString("ko-KR")}회`,
  },
  { label: "출력물(견적서·계약서 등)", free: "워터마크 표시", pro: "워터마크 없음" },
  { label: "수금·수익성 관리", free: "포함", pro: "포함" },
];

export function PlanComparison({ currentPlan }: { currentPlan?: "free" | "pro" }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <PlanCard
        name="Free"
        price="₩0"
        sub="기본 기능"
        active={currentPlan === "free"}
        values={rows.map((r) => r.free)}
      />
      <PlanCard
        name="Pro"
        price={formatKRW(PRO_PRICE_KRW)}
        sub="/ 월"
        highlight
        active={currentPlan === "pro"}
        values={rows.map((r) => r.pro)}
      />
      <ul className="col-span-2 mt-1 space-y-1.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="size-3.5 text-profit" /> {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanCard({
  name,
  price,
  sub,
  values,
  highlight,
  active,
}: {
  name: string;
  price: string;
  sub: string;
  values: string[];
  highlight?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight ? "border-accent bg-accent/5" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold">{name}</span>
        {active ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            현재
          </span>
        ) : null}
      </div>
      <p className="mt-1">
        <span className="num text-2xl font-bold">{price}</span>{" "}
        <span className="text-xs text-muted-foreground">{sub}</span>
      </p>
      <ul className="mt-3 space-y-1.5">
        {values.map((v, i) => (
          <li key={i} className="text-xs">
            {v}
          </li>
        ))}
      </ul>
    </div>
  );
}
