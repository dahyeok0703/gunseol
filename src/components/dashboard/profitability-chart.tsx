"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatKRW } from "@/lib/utils";
import type { ProfitPoint } from "@/lib/data/finance";

const QUOTE = "#2e9e5b"; // 견적 마진 (profit)
const ACTUAL = "#e08a00"; // 실제 마진 (accent)

const short = (n: string) => (n.length > 8 ? `${n.slice(0, 8)}…` : n);
const won = (v: number) => `${Math.round(v / 10000).toLocaleString("ko-KR")}만`;

export function ProfitabilityChart({ data }: { data: ProfitPoint[] }) {
  const rows = data.map((d) => ({
    name: short(d.name),
    full: d.name,
    견적: d.quoteMargin,
    실제: d.actualMargin,
  }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={won}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            formatter={(value, name) => [formatKRW(Number(value)), `${String(name)} 마진`]}
            labelFormatter={(_, payload) =>
              (payload?.[0]?.payload as { full?: string } | undefined)?.full ?? ""
            }
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="견적" fill={QUOTE} radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="실제" fill={ACTUAL} radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
