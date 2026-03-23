"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface TrendSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

/** Tiny inline sparkline chart for KPI cards */
export function TrendSparkline({
  data,
  color = "#38bdf8",
  height = 32,
}: TrendSparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
