"use client";

import { GlobeCanvas } from "./GlobeCanvas";
import { MetricCard } from "./MetricCard";
import { useAirports } from "@/lib/useAirports";

export function GlobeHero() {
  const { stats } = useAirports();

  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,0.06),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.04),transparent_50%)]" />

      <div className="relative max-w-[1400px] mx-auto px-6 pt-12 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            4,000+ Airports Mapped
            <br />
            <span className="text-cyan-400">
              2,500+ Intelligence Agents Deployed
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Each agent tracks public airport intelligence across revenue lines,
            assets, contracts, KPIs, charges, vendors and source documents.
          </p>
        </div>

        <div className="relative flex justify-center mb-10">
          <GlobeCanvas />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-10">
          <MetricCard
            title="Airports mapped"
            value={stats.total || 4145}
          />
          <MetricCard
            title="Agents deployed"
            value={2500}
            suffix="+"
            href="/platform/DAdemo/enterprise-access/portal/agents"
          />
          <MetricCard
            title="Potential KPI fields"
            value={5000}
            suffix="+"
          />
          <MetricCard
            title="Sources indexed"
            value={120000}
            suffix="+"
          />
          <MetricCard
            title="Avg confidence"
            value={74}
            suffix="%"
          />
          <MetricCard
            title="Extraction progress"
            value={3}
            suffix="%"
          />
        </div>

        <a
          href="/platform/DAdemo/enterprise-access/portal/system"
          className="block max-w-3xl mx-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 mb-4 hover:border-cyan-500/20 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex items-center justify-center w-4 h-4">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-[ping_2s_ease-in-out_infinite] opacity-40" />
                <span className="relative w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
                System Online
              </p>
            </div>
            <span className="text-[10px] text-slate-600">View live metrics →</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            4 of 4 systems operational
          </p>
        </a>
      </div>
    </section>
  );
}
