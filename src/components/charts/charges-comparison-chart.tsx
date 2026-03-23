"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { chargesComparisonData } from "@/lib/chart-data";

/** Horizontal bar chart comparing airport charges across major hubs */
export function ChargesComparisonChart() {
  return (
    <div className="h-[220px] sm:h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chargesComparisonData} barGap={2}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148,163,184,0.1)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              background: "#1a2332",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "13px",
            }}
            formatter={(value, name) => [
              `$${Number(value).toLocaleString()}`,
              name === "landing" ? "Landing Fee" : "Pax Charge",
            ]}
          />
          <Bar
            dataKey="landing"
            fill="#38bdf8"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={1200}
          />
          <Bar
            dataKey="passenger"
            fill="#818cf8"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={1200}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
