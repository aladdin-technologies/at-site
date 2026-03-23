"use client";

import { cn } from "@/lib/cn";
import { TrendingUp, TrendingDown } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";

interface KpiCardProps {
  label: string;
  value: string;
  change: number;
  unit?: string;
  className?: string;
}

/** Dashboard-style KPI display card with animated counter and trend indicator */
export function KpiCard({ label, value, change, unit = "", className }: KpiCardProps) {
  const isPositive = change >= 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border-default bg-surface p-5 transition-all duration-300 hover:border-border-accent",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold text-text-primary">
          <CountUp value={value} />
        </span>
        {unit && (
          <span className="text-sm text-text-tertiary">{unit}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="h-3.5 w-3.5 text-accent-success" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-accent-danger" />
        )}
        <span
          className={cn(
            "text-xs font-medium",
            isPositive ? "text-accent-success" : "text-accent-danger"
          )}
        >
          {isPositive ? "+" : ""}
          {change}%
        </span>
        <span className="text-xs text-text-tertiary">vs last year</span>
      </div>
    </div>
  );
}
