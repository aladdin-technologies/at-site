"use client";

import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FadeIn } from "@/components/motion/fade-in";
import { Heading } from "@/components/ui/heading";
import { GradientText } from "@/components/ui/gradient-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { liveFlightData } from "@/lib/chart-data";
import { Activity, Wifi, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

/** Live airport intelligence section — real-time data feed aesthetic */
export function LiveIntelligence() {
  return (
    <SectionWrapper id="intelligence">
      <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
        {/* Left — narrative */}
        <FadeIn direction="left">
          <Badge variant="success" className="mb-6">
            <Activity className="h-3 w-3" />
            Live Monitoring
          </Badge>
          <Heading level={2} className="mb-4">
            Real-Time Airport{" "}
            <GradientText>Performance</GradientText>
          </Heading>
          <p className="text-text-secondary leading-relaxed">
            Continuously updated operational intelligence across global
            airport networks. Monitor traffic flows, on-time performance,
            capacity utilization, and emerging disruptions — before they
            impact your operations.
          </p>
          <div className="mt-8 space-y-4">
            {[
              "Passenger throughput updated hourly",
              "On-time performance by airport and airline",
              "Capacity utilization and congestion signals",
              "Weather and operational disruption alerts",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-success animate-pulse-soft" />
                <span className="text-sm text-text-secondary">{item}</span>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Right — live data table mockup */}
        <FadeIn direction="right">
          <Card variant="default" className="overflow-hidden !p-0">
            {/* Table header */}
            <div className="flex items-center justify-between border-b border-border-default bg-surface-secondary px-4 py-3">
              <div className="flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5 text-accent-success" />
                <span className="text-xs font-medium text-text-secondary">
                  Live Airport Feed
                </span>
              </div>
              <span className="text-xs text-text-tertiary">
                Updated 2 min ago
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default text-left">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Airport
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Pax/wk
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      OTP
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Load
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {liveFlightData.map((row) => (
                    <tr
                      key={row.airport}
                      className="border-b border-border-default last:border-0 hover:bg-surface-elevated transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-text-primary">
                        {row.airport}
                      </td>
                      <td className="px-4 py-3">
                        {row.status === "operational" ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-accent-success" />
                            <span className="text-xs text-accent-success">
                              Operational
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3 w-3 text-accent-warm" />
                            <span className="text-xs text-accent-warm">
                              Delays
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-text-secondary">
                        {row.pax}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "font-mono",
                            row.onTime >= 80
                              ? "text-accent-success"
                              : row.onTime >= 70
                              ? "text-accent-warm"
                              : "text-accent-danger"
                          )}
                        >
                          {row.onTime}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-secondary">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                row.load >= 85
                                  ? "bg-accent-warm"
                                  : "bg-accent-primary"
                              )}
                              style={{ width: `${row.load}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-text-tertiary">
                            {row.load}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </FadeIn>
      </div>
    </SectionWrapper>
  );
}
