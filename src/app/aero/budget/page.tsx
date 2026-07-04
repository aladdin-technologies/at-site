"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Target, TrendingUp, TrendingDown } from "lucide-react";

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
  forecast_airports: { code: string; name: string };
}

interface YieldRow {
  year: number;
  month: number;
  yield_rate: number;
  forecast_revenue_lines: { name: string; traffic_metric: string };
  forecast_airports: { code: string; name: string };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function BudgetPage() {
  const [traffic, setTraffic] = useState<TrafficRow[]>([]);
  const [yields, setYields] = useState<YieldRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetYear, setBudgetYear] = useState(2025);
  const [budgetUplift, setBudgetUplift] = useState(5);

  useEffect(() => {
    async function load() {
      const [tRes, yRes] = await Promise.all([
        supabase.from("forecast_traffic").select("*, forecast_airports(code, name)"),
        supabase.from("forecast_yields").select("*, forecast_revenue_lines(name, traffic_metric), forecast_airports(code, name)"),
      ]);
      setTraffic((tRes.data ?? []) as unknown as TrafficRow[]);
      setYields((yRes.data ?? []) as unknown as YieldRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const years = useMemo(() => [...new Set(traffic.map(t => t.year))].sort(), [traffic]);
  const baseYear = budgetYear - 1;

  function getMonthlyRevenue(year: number) {
    const monthly: number[] = new Array(12).fill(0);
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
          monthly[t.month - 1] += tv * Number(y.yield_rate);
        }
      }
    }
    return monthly;
  }

  const actuals = useMemo(() => getMonthlyRevenue(budgetYear), [traffic, yields, budgetYear]);
  const baseActuals = useMemo(() => getMonthlyRevenue(baseYear), [traffic, yields, baseYear]);
  const budgetTargets = useMemo(() => baseActuals.map(v => v * (1 + budgetUplift / 100)), [baseActuals, budgetUplift]);

  const totalActual = actuals.reduce((a, b) => a + b, 0);
  const totalBudget = budgetTargets.reduce((a, b) => a + b, 0);
  const totalVariance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;
  const monthsWithData = actuals.filter(v => v > 0).length;

  const actualCounter = useCountUp(Math.round(totalActual / 1000000));
  const budgetCounter = useCountUp(Math.round(totalBudget / 1000000));
  const varianceCounter = useCountUp(Math.round(Math.abs(totalVariance) * 10));
  const achievementCounter = useCountUp(totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Budget vs Actuals</h1>
          <p className="text-sm text-gray-500">Track performance against budget targets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Uplift %</label>
            <input
              type="number"
              value={budgetUplift}
              onChange={(e) => setBudgetUplift(Number(e.target.value))}
              className="w-16 px-2 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 outline-none text-center"
            />
          </div>
          <select
            value={budgetYear}
            onChange={(e) => setBudgetYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 outline-none"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div ref={actualCounter.ref} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Actual Revenue</p>
          <p className="text-2xl font-bold text-gray-900 font-mono">${actualCounter.value.toLocaleString()}M</p>
          <p className="text-[10px] text-gray-400 mt-1">{monthsWithData} months reported</p>
        </div>
        <div ref={budgetCounter.ref} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Budget Target</p>
          <p className="text-2xl font-bold text-gray-900 font-mono">${budgetCounter.value.toLocaleString()}M</p>
          <p className="text-[10px] text-gray-400 mt-1">{baseYear} + {budgetUplift}% uplift</p>
        </div>
        <div ref={varianceCounter.ref} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Variance</p>
          <p className={`text-2xl font-bold font-mono ${totalVariance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {totalVariance >= 0 ? "+" : "-"}{(varianceCounter.value / 10).toFixed(1)}%
          </p>
          <div className={`flex items-center gap-1 text-[10px] mt-1 ${totalVariance >= 0 ? "text-emerald-500" : "text-red-400"}`}>
            {totalVariance >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {totalVariance >= 0 ? "Above" : "Below"} target
          </div>
        </div>
        <div ref={achievementCounter.ref} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Achievement</p>
          <p className="text-2xl font-bold text-gray-900 font-mono">{achievementCounter.value}%</p>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${achievementCounter.value >= 100 ? "bg-emerald-500" : achievementCounter.value >= 90 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(achievementCounter.value, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Monthly budget vs actuals chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Budget vs Actuals — {budgetYear}</h2>
        <div className="flex items-end gap-2 h-56">
          {MONTHS.map((m, i) => {
            const actual = actuals[i];
            const budget = budgetTargets[i];
            const maxVal = Math.max(...actuals, ...budgetTargets, 1);
            const actualPct = (actual / maxVal) * 100;
            const budgetPct = (budget / maxVal) * 100;
            const variance = budget > 0 ? ((actual - budget) / budget) * 100 : 0;
            return (
              <div key={m} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="w-full flex gap-0.5 items-end" style={{ height: "100%" }}>
                  <div
                    className="flex-1 rounded-t-sm bg-gray-200 transition-all duration-500"
                    style={{ height: `${budgetPct}%`, minHeight: 2 }}
                    title={`Budget: $${Math.round(budget / 1000000)}M`}
                  />
                  <div
                    className={`flex-1 rounded-t-sm transition-all duration-700 ${actual >= budget ? "bg-emerald-500" : "bg-red-400"}`}
                    style={{ height: `${actualPct}%`, minHeight: 2, animation: `barGrow 0.8s ease-out ${i * 60}ms forwards` }}
                    title={`Actual: $${Math.round(actual / 1000000)}M`}
                  />
                </div>
                <span className="text-[10px] text-gray-500">{m}</span>

                {/* Hover tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                  <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl">
                    <p className="font-bold mb-1">{m} {budgetYear}</p>
                    <p>Budget: ${Math.round(budget / 1000000)}M</p>
                    <p>Actual: ${Math.round(actual / 1000000)}M</p>
                    <p className={variance >= 0 ? "text-emerald-400" : "text-red-400"}>
                      Variance: {variance >= 0 ? "+" : ""}{variance.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-6 mt-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-200" />
            <span className="text-[10px] text-gray-500">Budget</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-[10px] text-gray-500">Actual (on target)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-400" />
            <span className="text-[10px] text-gray-500">Actual (below target)</span>
          </div>
        </div>
        <style>{`
          @keyframes barGrow {
            from { transform: scaleY(0); transform-origin: bottom; }
            to { transform: scaleY(1); transform-origin: bottom; }
          }
        `}</style>
      </div>

      {/* Monthly detail table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Target size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Monthly Detail — {budgetYear}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Month</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Budget</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actual</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Variance</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((m, i) => {
                const budget = budgetTargets[i];
                const actual = actuals[i];
                const variance = budget > 0 ? ((actual - budget) / budget) * 100 : 0;
                const isAbove = actual >= budget;
                return (
                  <tr key={m} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{m} {budgetYear}</td>
                    <td className="px-4 py-3 text-right text-gray-500 font-mono">${Math.round(budget / 1000000).toLocaleString()}M</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-mono font-semibold">${Math.round(actual / 1000000).toLocaleString()}M</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${isAbove ? "text-emerald-600" : "text-red-500"}`}>
                      {isAbove ? "+" : ""}{variance.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      {actual === 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Pending</span>
                      ) : isAbove ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">On Track</span>
                      ) : variance > -5 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Near Target</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700">Below Target</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50/80 font-semibold">
                <td className="px-4 py-3 text-gray-900">Full Year</td>
                <td className="px-4 py-3 text-right text-gray-900 font-mono">${Math.round(totalBudget / 1000000).toLocaleString()}M</td>
                <td className="px-4 py-3 text-right text-gray-900 font-mono">${Math.round(totalActual / 1000000).toLocaleString()}M</td>
                <td className={`px-4 py-3 text-right font-mono ${totalVariance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {totalVariance >= 0 ? "+" : ""}{totalVariance.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${totalVariance >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {totalVariance >= 0 ? "On Track" : "Below Target"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
