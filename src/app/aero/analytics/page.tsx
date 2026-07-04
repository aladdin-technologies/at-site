"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAeroCurrencyConverter } from "@/lib/useAeroCurrency";

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!target) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        function tick(now: number) {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setValue(Math.round(target * ease));
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return { value, ref };
}

interface TrafficRow {
  year: number;
  month: number;
  arr_pax_direct: number;
  dep_pax_direct: number;
  transfer_pax: number;
  transit_pax: number;
  total_movements: number;
  total_mtow_tonnes: number;
  forecast_airlines: { code: string; name: string };
  forecast_airports: { code: string; name: string };
}

interface YieldRow {
  year: number;
  month: number;
  yield_rate: number;
  currency: string;
  forecast_revenue_lines: { name: string; charge_basis: string; traffic_metric: string };
  forecast_airports: { code: string; name: string };
}

export default function AnalyticsPage() {
  const [traffic, setTraffic] = useState<TrafficRow[]>([]);
  const [yields, setYields] = useState<YieldRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { convert, symbol } = useAeroCurrencyConverter();

  useEffect(() => {
    async function load() {
      const [tRes, yRes] = await Promise.all([
        supabase.from("forecast_traffic").select("*, forecast_airlines(code, name), forecast_airports(code, name)"),
        supabase.from("forecast_yields").select("*, forecast_revenue_lines(name, charge_basis, traffic_metric), forecast_airports(code, name)"),
      ]);
      setTraffic((tRes.data ?? []) as unknown as TrafficRow[]);
      setYields((yRes.data ?? []) as unknown as YieldRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const years = useMemo(() => [...new Set(traffic.map((t) => t.year))].sort(), [traffic]);
  const latestYear = years[years.length - 1] || 2025;
  const prevYear = years[years.length - 2] || 2024;

  const getYearPax = (year: number) => traffic.filter(t => t.year === year).reduce((s, t) => s + t.arr_pax_direct + t.dep_pax_direct + t.transfer_pax + t.transit_pax, 0);
  const getYearMovements = (year: number) => traffic.filter(t => t.year === year).reduce((s, t) => s + t.total_movements, 0);
  const getYearRevenue = (year: number) => {
    let rev = 0;
    const yt = traffic.filter(t => t.year === year);
    const yy = yields.filter(y => y.year === year);
    for (const t of yt) {
      for (const y of yy) {
        if ((t.forecast_airports as any)?.code === (y.forecast_airports as any)?.code && t.month === y.month) {
          const metric = (y.forecast_revenue_lines as any)?.traffic_metric;
          let tv = 0;
          if (metric === "dep_pax_direct") tv = t.dep_pax_direct;
          else if (metric === "total_movements") tv = t.total_movements;
          else if (metric === "total_mtow_tonnes") tv = t.total_mtow_tonnes;
          rev += tv * Number(y.yield_rate);
        }
      }
    }
    return rev;
  };

  const curPax = getYearPax(latestYear);
  const prevPax = getYearPax(prevYear);
  const paxGrowth = prevPax > 0 ? ((curPax - prevPax) / prevPax) * 100 : 0;

  const curMov = getYearMovements(latestYear);
  const prevMov = getYearMovements(prevYear);
  const movGrowth = prevMov > 0 ? ((curMov - prevMov) / prevMov) * 100 : 0;

  const curRev = getYearRevenue(latestYear);
  const prevRev = getYearRevenue(prevYear);
  const revGrowth = prevRev > 0 ? ((curRev - prevRev) / prevRev) * 100 : 0;

  const yieldPerPax = curPax > 0 ? curRev / curPax : 0;
  const prevYieldPerPax = prevPax > 0 ? prevRev / prevPax : 0;
  const yieldGrowth = prevYieldPerPax > 0 ? ((yieldPerPax - prevYieldPerPax) / prevYieldPerPax) * 100 : 0;

  const paxCounter = useCountUp(Math.round(curPax / 1000000));
  const movCounter = useCountUp(Math.round(curMov / 1000));
  const revCounter = useCountUp(Math.round(curRev / 1000000));
  const yieldCounter = useCountUp(Math.round(yieldPerPax * 100));

  const revenueByLine = useMemo(() => {
    const byLine: Record<string, number> = {};
    const yt = traffic.filter(t => t.year === latestYear);
    const yy = yields.filter(y => y.year === latestYear);
    for (const t of yt) {
      for (const y of yy) {
        if ((t.forecast_airports as any)?.code === (y.forecast_airports as any)?.code && t.month === y.month) {
          const lineName = (y.forecast_revenue_lines as any)?.name || "Other";
          const metric = (y.forecast_revenue_lines as any)?.traffic_metric;
          let tv = 0;
          if (metric === "dep_pax_direct") tv = t.dep_pax_direct;
          else if (metric === "total_movements") tv = t.total_movements;
          else if (metric === "total_mtow_tonnes") tv = t.total_mtow_tonnes;
          byLine[lineName] = (byLine[lineName] || 0) + tv * Number(y.yield_rate);
        }
      }
    }
    return Object.entries(byLine).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [traffic, yields, latestYear]);

  const totalLineRev = revenueByLine.reduce((s, l) => s + l.revenue, 0);
  const lineColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

  const quarterlyRevenue = useMemo(() => {
    const quarters: { label: string; revenue: number }[] = [];
    const yt = traffic.filter(t => t.year === latestYear);
    const yy = yields.filter(y => y.year === latestYear);
    for (let q = 0; q < 4; q++) {
      const months = [q * 3 + 1, q * 3 + 2, q * 3 + 3];
      let rev = 0;
      for (const t of yt.filter(t => months.includes(t.month))) {
        for (const y of yy.filter(y => months.includes(y.month))) {
          if ((t.forecast_airports as any)?.code === (y.forecast_airports as any)?.code && t.month === y.month) {
            const metric = (y.forecast_revenue_lines as any)?.traffic_metric;
            let tv = 0;
            if (metric === "dep_pax_direct") tv = t.dep_pax_direct;
            else if (metric === "total_movements") tv = t.total_movements;
            else if (metric === "total_mtow_tonnes") tv = t.total_mtow_tonnes;
            rev += tv * Number(y.yield_rate);
          }
        }
      }
      quarters.push({ label: `Q${q + 1}`, revenue: rev });
    }
    return quarters;
  }, [traffic, yields, latestYear]);

  const maxQuarter = Math.max(...quarterlyRevenue.map(q => q.revenue), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  function MetricCard({ label, value, suffix, growth, counterRef }: { label: string; value: number; suffix: string; growth: number; counterRef: React.RefObject<HTMLDivElement | null> }) {
    const isPositive = growth >= 0;
    return (
      <div ref={counterRef} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
        <p className="text-2xl font-bold text-gray-900 font-mono mb-2">{value.toLocaleString()}{suffix}</p>
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPositive ? "+" : ""}{growth.toFixed(1)}% YoY
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Performance insights across your airport portfolio — {latestYear}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Passengers" value={paxCounter.value} suffix="M" growth={paxGrowth} counterRef={paxCounter.ref} />
        <MetricCard label="Aircraft Movements" value={movCounter.value} suffix="K" growth={movGrowth} counterRef={movCounter.ref} />
        <MetricCard label="Total Revenue" value={revCounter.value} suffix="M" growth={revGrowth} counterRef={revCounter.ref} />
        <MetricCard label="Revenue per Pax" value={yieldCounter.value / 100} suffix="" growth={yieldGrowth} counterRef={yieldCounter.ref} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Charge Line */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Revenue by Charge Line</h2>
          <div className="space-y-3">
            {revenueByLine.map((line, i) => {
              const pct = totalLineRev > 0 ? (line.revenue / totalLineRev) * 100 : 0;
              return (
                <div key={line.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{line.name}</span>
                    <span className="text-sm text-gray-500 font-mono">{symbol}{Math.round(convert(line.revenue, "USD") / 1000000).toLocaleString()}M</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: lineColors[i % lineColors.length] }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{pct.toFixed(1)}% of total</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quarterly Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Quarterly Performance — {latestYear}</h2>
          <div className="flex items-end gap-6 h-52">
            {quarterlyRevenue.map((q, i) => {
              const pct = (q.revenue / maxQuarter) * 100;
              return (
                <div key={q.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono">{symbol}{Math.round(convert(q.revenue, "USD") / 1000000)}M</span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg transition-all duration-700 ease-out"
                      style={{
                        height: `${pct}%`,
                        minHeight: 4,
                        backgroundColor: lineColors[i],
                        animationDelay: `${i * 120}ms`,
                        animation: "barGrow 0.8s ease-out forwards",
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 font-semibold">{q.label}</span>
                </div>
              );
            })}
          </div>
          <style>{`
            @keyframes barGrow {
              from { transform: scaleY(0); transform-origin: bottom; }
              to { transform: scaleY(1); transform-origin: bottom; }
            }
          `}</style>
        </div>
      </div>

      {/* Year-over-year comparison table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Year-over-Year Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Metric</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{prevYear}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{latestYear}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Change</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Total Passengers", prev: prevPax, cur: curPax, fmt: (v: number) => `${(v / 1000000).toFixed(1)}M` },
                { name: "Aircraft Movements", prev: prevMov, cur: curMov, fmt: (v: number) => `${(v / 1000).toFixed(0)}K` },
                { name: "Total Revenue", prev: prevRev, cur: curRev, fmt: (v: number) => `${symbol}${(convert(v, "USD") / 1000000).toFixed(0)}M` },
                { name: "Revenue per Pax", prev: prevYieldPerPax, cur: yieldPerPax, fmt: (v: number) => `${symbol}${convert(v, "USD").toFixed(2)}` },
              ].map((row) => {
                const delta = row.prev > 0 ? ((row.cur - row.prev) / row.prev) * 100 : 0;
                const isPositive = delta >= 0;
                return (
                  <tr key={row.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-right text-gray-500 font-mono">{row.fmt(row.prev)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-mono font-semibold">{row.fmt(row.cur)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                      {isPositive ? "+" : ""}{delta.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
