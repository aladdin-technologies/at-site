"use client";

import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FadeIn } from "@/components/motion/fade-in";
import { Heading } from "@/components/ui/heading";
import { GradientText } from "@/components/ui/gradient-text";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/ui/kpi-card";
import { AirportPerformanceChart } from "@/components/charts/airport-performance-chart";
import { ChargesComparisonChart } from "@/components/charts/charges-comparison-chart";
import { RegionalDistributionChart } from "@/components/charts/regional-distribution-chart";
import { kpiMetrics } from "@/lib/chart-data";

/** Benchmarking section — enterprise dashboard mockup with KPIs and charts */
export function Benchmarking() {
  return (
    <SectionWrapper id="benchmarking" alternate>
      <FadeIn>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="accent" className="mb-6">
            Enterprise Platform
          </Badge>
          <Heading level={2} className="mb-4">
            Airport{" "}
            <GradientText>Benchmarking Platform</GradientText>
          </Heading>
          <p className="text-text-secondary">
            Compare performance across 2,847 airports worldwide. Revenue
            efficiency, cost structures, traffic metrics, and service quality
            — all in one analytical environment.
          </p>
        </div>
      </FadeIn>

      {/* Dashboard mockup */}
      <FadeIn delay={0.2}>
        <div className="mt-12 overflow-hidden rounded-2xl border border-border-default bg-surface shadow-2xl">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-border-default bg-surface-secondary px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-accent-danger/40" />
              <div className="h-3 w-3 rounded-full bg-accent-warm/40" />
              <div className="h-3 w-3 rounded-full bg-accent-success/40" />
            </div>
            <div className="ml-4 flex items-center gap-2 text-xs text-text-tertiary">
              <span className="rounded bg-surface px-2 py-0.5">
                Dashboard
              </span>
              <span>/</span>
              <span>Global Benchmarking</span>
              <span>/</span>
              <span className="text-text-secondary">2024 Annual</span>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-3 sm:p-6">
            {/* KPI row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpiMetrics.map((kpi) => (
                <KpiCard key={kpi.label} {...kpi} />
              ))}
            </div>

            {/* Charts row */}
            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              {/* Area chart — wider */}
              <div className="rounded-xl border border-border-default bg-surface-secondary p-4 lg:col-span-3">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      Passenger Throughput
                    </h4>
                    <p className="text-xs text-text-tertiary">
                      Monthly · Actual vs Forecast (M pax)
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-4 rounded-full bg-accent-primary" />
                      <span className="text-xs text-text-tertiary">
                        Actual
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-4 rounded-full bg-accent-secondary opacity-60" />
                      <span className="text-xs text-text-tertiary">
                        Forecast
                      </span>
                    </div>
                  </div>
                </div>
                <AirportPerformanceChart />
              </div>

              {/* Donut chart — narrower */}
              <div className="rounded-xl border border-border-default bg-surface-secondary p-4 lg:col-span-2">
                <h4 className="mb-2 text-sm font-semibold text-text-primary">
                  Regional Distribution
                </h4>
                <p className="mb-4 text-xs text-text-tertiary">
                  Airport coverage by region
                </p>
                <RegionalDistributionChart />
              </div>
            </div>

            {/* Bar chart full width */}
            <div className="mt-6 rounded-xl border border-border-default bg-surface-secondary p-3 sm:p-4">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">
                    Airport Charges Comparison
                  </h4>
                  <p className="text-xs text-text-tertiary">
                    Landing & passenger charges by hub (USD)
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-4 rounded-full bg-accent-primary" />
                    <span className="text-xs text-text-tertiary">
                      Landing
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-4 rounded-full bg-accent-secondary" />
                    <span className="text-xs text-text-tertiary">
                      Passenger
                    </span>
                  </div>
                </div>
              </div>
              <ChargesComparisonChart />
            </div>
          </div>
        </div>
      </FadeIn>
    </SectionWrapper>
  );
}
