"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Building2 } from "lucide-react";
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

function KPI({ label, value, prefix, suffix, color }: { label: string; value: number; prefix?: string; suffix?: string; color: string }) {
  const counter = useCountUp(value);
  return (
    <div ref={counter.ref} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900 font-mono">
        {prefix}{counter.value.toLocaleString()}{suffix}
      </p>
    </div>
  );
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

export default function ForecastDashboard() {
  const [traffic, setTraffic] = useState<TrafficRow[]>([]);
  const [yields, setYields] = useState<YieldRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
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

  const yearTraffic = useMemo(() => {
    return traffic.filter((t) => t.year === selectedYear);
  }, [traffic, selectedYear]);

  const totalPax = useMemo(() => {
    return yearTraffic.reduce((sum, t) => sum + t.arr_pax_direct + t.dep_pax_direct + t.transfer_pax + t.transit_pax, 0);
  }, [yearTraffic]);

  const totalMovements = useMemo(() => {
    return yearTraffic.reduce((sum, t) => sum + t.total_movements, 0);
  }, [yearTraffic]);

  const totalRevenue = useMemo(() => {
    let rev = 0;
    const yearYields = yields.filter((y) => y.year === selectedYear);
    for (const t of yearTraffic) {
      for (const y of yearYields) {
        if ((t.forecast_airports as any)?.code === (y.forecast_airports as any)?.code && t.month === y.month) {
          const metric = (y.forecast_revenue_lines as any)?.traffic_metric;
          let trafficVal = 0;
          if (metric === "dep_pax_direct") trafficVal = t.dep_pax_direct;
          else if (metric === "total_movements") trafficVal = t.total_movements;
          else if (metric === "total_mtow_tonnes") trafficVal = t.total_mtow_tonnes;
          rev += trafficVal * Number(y.yield_rate);
        }
      }
    }
    return Math.round(rev);
  }, [yearTraffic, yields, selectedYear]);

  const monthlyRevenue = useMemo(() => {
    const monthly: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) monthly[m] = 0;
    const yearYields = yields.filter((y) => y.year === selectedYear);
    for (const t of yearTraffic) {
      for (const y of yearYields) {
        if ((t.forecast_airports as any)?.code === (y.forecast_airports as any)?.code && t.month === y.month) {
          const metric = (y.forecast_revenue_lines as any)?.traffic_metric;
          let trafficVal = 0;
          if (metric === "dep_pax_direct") trafficVal = t.dep_pax_direct;
          else if (metric === "total_movements") trafficVal = t.total_movements;
          else if (metric === "total_mtow_tonnes") trafficVal = t.total_mtow_tonnes;
          monthly[t.month] += trafficVal * Number(y.yield_rate);
        }
      }
    }
    return monthly;
  }, [yearTraffic, yields, selectedYear]);

  const maxMonthly = Math.max(...Object.values(monthlyRevenue), 1);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const airportBreakdown = useMemo(() => {
    const byApt: Record<string, { name: string; pax: number; movements: number; revenue: number }> = {};
    const yearYields = yields.filter((y) => y.year === selectedYear);
    for (const t of yearTraffic) {
      const aptCode = (t.forecast_airports as any)?.code;
      if (!byApt[aptCode]) byApt[aptCode] = { name: (t.forecast_airports as any)?.name, pax: 0, movements: 0, revenue: 0 };
      byApt[aptCode].pax += t.arr_pax_direct + t.dep_pax_direct + t.transfer_pax + t.transit_pax;
      byApt[aptCode].movements += t.total_movements;
      for (const y of yearYields) {
        if ((y.forecast_airports as any)?.code === aptCode && y.month === t.month) {
          const metric = (y.forecast_revenue_lines as any)?.traffic_metric;
          let tv = 0;
          if (metric === "dep_pax_direct") tv = t.dep_pax_direct;
          else if (metric === "total_movements") tv = t.total_movements;
          else if (metric === "total_mtow_tonnes") tv = t.total_mtow_tonnes;
          byApt[aptCode].revenue += tv * Number(y.yield_rate);
        }
      }
    }
    return Object.entries(byApt).map(([code, data]) => ({ code, ...data }));
  }, [yearTraffic, yields, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Revenue Forecast Dashboard</h1>
          <p className="text-sm text-gray-500">Global Aviation Group — {selectedYear} Overview</p>
        </div>
        <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <KPI label="Total Passengers" value={totalPax} suffix="" color="#3b82f6" />
          <KPI label="Aircraft Movements" value={totalMovements} suffix="" color="#8b5cf6" />
          <KPI label="Total Revenue" value={Math.round(convert(totalRevenue, "USD") / 1000000)} prefix={symbol} suffix="M" color="#10b981" />
          <KPI label="Revenue Lines" value={6} suffix="" color="#f59e0b" />
        </div>

        {/* Monthly revenue chart — animated bars with hover intelligence */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Revenue — {selectedYear}</h2>
          <div className="flex items-end gap-2 h-64">
            {MONTHS.map((m, i) => {
              const monthNum = i + 1;
              const val = monthlyRevenue[monthNum] || 0;
              const pct = (val / maxMonthly) * 100;
              const prevMonth = monthlyRevenue[monthNum - 1] || 0;
              const momDelta = prevMonth > 0 ? ((val - prevMonth) / prevMonth * 100) : 0;
              const prevYearTraffic = traffic.filter((t) => t.year === selectedYear - 1);
              let prevYearRev = 0;
              const prevYearYields = yields.filter((y) => y.year === selectedYear - 1);
              for (const t of prevYearTraffic.filter((t) => t.month === monthNum)) {
                for (const y of prevYearYields) {
                  if ((t.forecast_airports as any)?.code === (y.forecast_airports as any)?.code && t.month === y.month) {
                    const metric = (y.forecast_revenue_lines as any)?.traffic_metric;
                    let tv = 0;
                    if (metric === "dep_pax_direct") tv = t.dep_pax_direct;
                    else if (metric === "total_movements") tv = t.total_movements;
                    else if (metric === "total_mtow_tonnes") tv = t.total_mtow_tonnes;
                    prevYearRev += tv * Number(y.yield_rate);
                  }
                }
              }
              const yoyDelta = prevYearRev > 0 ? ((val - prevYearRev) / prevYearRev * 100) : 0;

              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1 group relative h-full">
                  <span className="text-[9px] text-gray-400 font-mono shrink-0">{symbol}{Math.round(convert(val, "USD") / 1000000)}M</span>
                  <div className="w-full flex-1 flex items-end overflow-hidden">
                    <div
                      className="w-full rounded-t-md bg-blue-500 hover:bg-blue-600 transition-colors duration-300 cursor-pointer animate-[growUp_0.8s_ease-out_forwards]"
                      style={{ height: `${pct}%`, minHeight: 4, animationDelay: `${i * 80}ms`, opacity: 0 }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0">{m}</span>

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                    <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl">
                      <p className="font-bold mb-1">{m} {selectedYear}: {symbol}{Math.round(convert(val, "USD") / 1000000).toLocaleString()}M</p>
                      {prevMonth > 0 && (
                        <p className={momDelta >= 0 ? "text-emerald-400" : "text-red-400"}>
                          vs prev month: {momDelta >= 0 ? "+" : ""}{momDelta.toFixed(1)}%
                        </p>
                      )}
                      {prevYearRev > 0 && (
                        <p className={yoyDelta >= 0 ? "text-emerald-400" : "text-red-400"}>
                          vs {selectedYear - 1}: {yoyDelta >= 0 ? "+" : ""}{yoyDelta.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <style>{`
            @keyframes growUp {
              from { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
              to { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
            }
          `}</style>
        </div>

        {/* Airport breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Airport Breakdown — {selectedYear}</h2>
          <div className="space-y-3">
            {airportBreakdown.map((apt) => (
              <div
                key={apt.code}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Building2 size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{apt.name}</p>
                    <p className="text-xs text-gray-500">{apt.code} — {apt.pax.toLocaleString()} pax, {apt.movements.toLocaleString()} movements</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 font-mono">{symbol}{Math.round(convert(apt.revenue, "USD") / 1000000).toLocaleString()}M</p>
                  <p className="text-xs text-gray-500">Total revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
