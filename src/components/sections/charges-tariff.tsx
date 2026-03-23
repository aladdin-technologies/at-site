"use client";

import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FadeIn } from "@/components/motion/fade-in";
import { Heading } from "@/components/ui/heading";
import { GradientText } from "@/components/ui/gradient-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { tariffHistoryData } from "@/lib/chart-data";
import { DollarSign, TrendingUp, FileText, ArrowRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/** Charges & tariff intelligence — structured data product with history chart */
export function ChargesTariff() {
  return (
    <SectionWrapper id="charges" alternate>
      <FadeIn>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="accent" className="mb-6">
            <DollarSign className="h-3.5 w-3.5" />
            Data Product
          </Badge>
          <Heading level={2} className="mb-4">
            Airport Charges &{" "}
            <GradientText>Tariff Intelligence</GradientText>
          </Heading>
          <p className="text-text-secondary">
            The most comprehensive global database of airport charges. Landing
            fees, passenger charges, parking, security levies, and regulatory
            filings — structured, normalized, and historically tracked.
          </p>
        </div>
      </FadeIn>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {/* Feature cards */}
        <FadeIn direction="left" className="space-y-4 lg:col-span-1">
          {[
            {
              icon: DollarSign,
              title: "Landing & Pax Charges",
              desc: "Per-aircraft and per-passenger fee structures across 800+ airports, updated quarterly.",
            },
            {
              icon: TrendingUp,
              title: "Historical Trends",
              desc: "Track charge evolution over 6+ years. Identify regulatory cycles, inflation impact, and competitive shifts.",
            },
            {
              icon: FileText,
              title: "Regulatory Filings",
              desc: "Access to original tariff documents, determination letters, and consultation responses.",
            },
          ].map((item) => (
            <Card key={item.title} variant="glow" hover className="!p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10">
                  <item.icon className="h-4 w-4 text-accent-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                    {item.desc}
                  </p>
                </div>
              </div>
            </Card>
          ))}
          <Button variant="secondary" className="w-full">
            Explore Database
            <ArrowRight className="h-4 w-4" />
          </Button>
        </FadeIn>

        {/* Chart */}
        <FadeIn direction="right" className="lg:col-span-2">
          <Card variant="default" className="!p-0 overflow-hidden">
            <div className="border-b border-border-default px-4 py-3 bg-surface-secondary">
              <h4 className="text-sm font-semibold text-text-primary">
                Passenger Charge History (USD per pax)
              </h4>
              <p className="text-xs text-text-tertiary">
                Major hubs · 2019–2024
              </p>
            </div>
            <div className="p-4">
              <div className="mb-4 flex flex-wrap gap-4">
                {[
                  { label: "LHR", color: "#38bdf8" },
                  { label: "CDG", color: "#818cf8" },
                  { label: "AMS", color: "#34d399" },
                  { label: "DXB", color: "#f59e0b" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div
                      className="h-2 w-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-text-tertiary">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-[220px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tariffHistoryData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.1)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="year"
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
                      formatter={(value) => [`$${value}`, ""]}
                    />
                    <Line
                      type="monotone"
                      dataKey="lhr"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={{ fill: "#38bdf8", r: 3 }}
                      isAnimationActive={true}
                    />
                    <Line
                      type="monotone"
                      dataKey="cdg"
                      stroke="#818cf8"
                      strokeWidth={2}
                      dot={{ fill: "#818cf8", r: 3 }}
                      isAnimationActive={true}
                    />
                    <Line
                      type="monotone"
                      dataKey="ams"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={{ fill: "#34d399", r: 3 }}
                      isAnimationActive={true}
                    />
                    <Line
                      type="monotone"
                      dataKey="dxb"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", r: 3 }}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>
    </SectionWrapper>
  );
}
