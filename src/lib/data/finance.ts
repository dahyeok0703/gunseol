import "server-only";
import { createClient } from "@/lib/supabase/server";
import { calcMargin } from "@/lib/utils";

/**
 * 현장 정산 — 견적가/실행가(예상)·실제 지출·수금 현황을 모은다.
 * ⚠️ 입력값 기반 참고치이며 회계·세무 신고를 대체하지 않는다.
 */
export interface Settlement {
  quotePrice: number; // 견적가
  quoteCost: number; // 실행가(예상 원가)
  actualSpend: number; // 실제 지출 (statements 합)
  collected: number; // 수금액 (입금 완료)
  receivable: number; // 받을 돈 (미수)
  billed: number; // 총 청구(수금 항목 합)
  quoteMargin: number;
  quoteRate: number;
  actualMargin: number; // 견적가 − 실제 지출
  actualRate: number;
}

export async function getProjectSettlement(projectId: string): Promise<Settlement> {
  const supabase = await createClient();

  const estP = supabase
    .from("estimates")
    .select("total_price, total_cost")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .returns<{ total_price: number; total_cost: number }[]>()
    .maybeSingle();
  const stmtP = supabase
    .from("statements")
    .select("amount")
    .eq("project_id", projectId)
    .returns<{ amount: number }[]>();
  const payP = supabase
    .from("payments")
    .select("amount, status")
    .eq("project_id", projectId)
    .returns<{ amount: number; status: string }[]>();

  const [est, stmts, pays] = await Promise.all([estP, stmtP, payP]);

  const quotePrice = Number(est.data?.total_price ?? 0);
  const quoteCost = Number(est.data?.total_cost ?? 0);
  const actualSpend = (stmts.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const collected = (pays.data ?? [])
    .filter((p) => p.status === "paid")
    .reduce((s, r) => s + Number(r.amount), 0);
  const receivable = (pays.data ?? [])
    .filter((p) => p.status === "pending")
    .reduce((s, r) => s + Number(r.amount), 0);

  const q = calcMargin(quotePrice, quoteCost);
  const a = calcMargin(quotePrice, actualSpend);

  return {
    quotePrice,
    quoteCost,
    actualSpend,
    collected,
    receivable,
    billed: collected + receivable,
    quoteMargin: q.margin,
    quoteRate: q.rate,
    actualMargin: a.margin,
    actualRate: a.rate,
  };
}

export interface UpcomingReceivable {
  id: string;
  label: string;
  amount: number;
  due_on: string | null;
  project_id: string;
  project_name: string | null;
  overdue: boolean;
}

export interface ProfitPoint {
  project_id: string;
  name: string;
  quoteMargin: number;
  actualMargin: number;
}

export interface DashboardFinance {
  receivableThisMonth: number;
  overdueAmount: number;
  inProgressCount: number;
  totalReceivable: number;
  upcoming: UpcomingReceivable[];
  profitability: ProfitPoint[];
}

export async function getDashboardFinance(
  workspaceId: string,
  range: { monthStart: string; monthEnd: string; today: string },
): Promise<DashboardFinance> {
  const supabase = await createClient();

  const paysP = supabase
    .from("payments")
    .select("id, label, amount, due_on, status, project_id")
    .eq("workspace_id", workspaceId)
    .returns<
      {
        id: string;
        label: string;
        amount: number;
        due_on: string | null;
        status: string;
        project_id: string | null;
      }[]
    >();
  const projP = supabase
    .from("project_overview")
    .select("id, name, status")
    .eq("workspace_id", workspaceId)
    .returns<{ id: string; name: string; status: string }[]>();
  const estP = supabase
    .from("estimates")
    .select("project_id, version, total_price, total_cost")
    .eq("workspace_id", workspaceId)
    .returns<
      { project_id: string | null; version: number; total_price: number; total_cost: number }[]
    >();
  const stmtP = supabase
    .from("statements")
    .select("project_id, amount")
    .eq("workspace_id", workspaceId)
    .returns<{ project_id: string | null; amount: number }[]>();

  const [pays, projects, estimates, statements] = await Promise.all([paysP, projP, estP, stmtP]);

  const projectName = new Map<string, string>();
  let inProgressCount = 0;
  for (const p of projects.data ?? []) {
    projectName.set(p.id, p.name);
    if (p.status === "in_progress") inProgressCount += 1;
  }

  const pending = (pays.data ?? []).filter((p) => p.status === "pending");
  const receivableThisMonth = pending
    .filter((p) => p.due_on && p.due_on >= range.monthStart && p.due_on <= range.monthEnd)
    .reduce((s, p) => s + Number(p.amount), 0);
  const overdueAmount = pending
    .filter((p) => p.due_on && p.due_on < range.today)
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalReceivable = pending.reduce((s, p) => s + Number(p.amount), 0);

  const upcoming: UpcomingReceivable[] = pending
    .slice()
    .sort((a, b) => (a.due_on ?? "9999").localeCompare(b.due_on ?? "9999"))
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      label: p.label,
      amount: Number(p.amount),
      due_on: p.due_on,
      project_id: p.project_id ?? "",
      project_name: p.project_id ? (projectName.get(p.project_id) ?? null) : null,
      overdue: Boolean(p.due_on && p.due_on < range.today),
    }));

  // 프로젝트별 최신 견적
  const latestEst = new Map<string, { total_price: number; total_cost: number; version: number }>();
  for (const e of estimates.data ?? []) {
    if (!e.project_id) continue;
    const cur = latestEst.get(e.project_id);
    if (!cur || e.version > cur.version) {
      latestEst.set(e.project_id, {
        total_price: Number(e.total_price),
        total_cost: Number(e.total_cost),
        version: e.version,
      });
    }
  }
  const spendByProject = new Map<string, number>();
  for (const s of statements.data ?? []) {
    if (!s.project_id) continue;
    spendByProject.set(s.project_id, (spendByProject.get(s.project_id) ?? 0) + Number(s.amount));
  }

  const profitability: ProfitPoint[] = [];
  for (const [pid, est] of latestEst) {
    if (!projectName.has(pid)) continue; // 활성 현장만
    const spend = spendByProject.get(pid) ?? 0;
    profitability.push({
      project_id: pid,
      name: projectName.get(pid) ?? "현장",
      quoteMargin: est.total_price - est.total_cost,
      actualMargin: est.total_price - spend,
    });
  }
  profitability.sort((a, b) => b.quoteMargin - a.quoteMargin);

  return {
    receivableThisMonth,
    overdueAmount,
    inProgressCount,
    totalReceivable,
    upcoming,
    profitability: profitability.slice(0, 6),
  };
}
