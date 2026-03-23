"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { regionalDistributionData } from "@/lib/chart-data";

/** Donut chart showing regional distribution of airport coverage */
export function RegionalDistributionChart() {
  return (
    <div className="w-full">
      <div className="h-[160px] sm:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={regionalDistributionData}
              cx="50%"
              cy="50%"
              innerRadius="38%"
              outerRadius="58%"
              paddingAngle={3}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={1200}
            >
              {regionalDistributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1a2332",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "13px",
              }}
              formatter={(value) => [`${value}%`, "Coverage"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {regionalDistributionData.map((item) => (
          <div key={item.name} className="flex items-center gap-1">
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[11px] text-text-secondary">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
