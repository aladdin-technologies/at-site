"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { passengerThroughputData } from "@/lib/chart-data";

/** Area chart showing monthly passenger throughput with forecast overlay */
export function AirportPerformanceChart() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={passengerThroughputData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={(v) => `${v}M`}
          />
          <Tooltip
            contentStyle={{
              background: "#1a2332",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "13px",
            }}
            formatter={(value) => [`${value}M pax`, ""]}
          />
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#818cf8"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#colorForecast)"
            isAnimationActive={true}
            animationDuration={1500}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#colorValue)"
            isAnimationActive={true}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
