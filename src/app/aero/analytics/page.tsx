"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAeroCurrencyConverter } from "@/lib/useAeroCurrency";
import { useActualMonths } from "@/lib/useActualMonths";

interface DataValue { airport_code: string; airline_code: string; metric_name: string; year: number; month: number; value: number; }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!target) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      function tick(now: number) {
        const t = Math.min((now - start) / duration, 1);
        setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return { value, ref };
}

export default function AnalyticsPage() {
  const [revenueData, setRevenueData] = useState<DataValue[]>([]);
  const [trafficData, setTrafficData] = useState<DataValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [viewMode, setViewMode] = useState<"full" | "ytd">("full");
  const { convert, symbol } = useAeroCurrencyConverter();
  const { actualMonths } = useActualMonths();

  useEffect(() => {
    async function load() {
      const baseHeaders: Record<string, string> = { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` };
      const restUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;

      async function fetchAll(filter: string): Promise<any[]> {
        const all: any[] = [];
        let from = 0;
        while (true) {
          const res = await fetch(`${restUrl}/historical_data?${filter}&order=year,month,airport_code,airline_code&offset=${from}&limit=1000`, { headers: baseHeaders });
          const data = await res.json();
          if (!Array.isArray(data) || data.length === 0) break;
          all.push(...data);
          if (data.length < 1000) break;
          from += 1000;
        }
        return all;
      }

      const [rev, trf] = await Promise.all([
        fetchAll("select=airport_code,airline_code,metric_name,year,month,value&data_type=eq.revenue"),
        fetchAll("select=airport_code,airline_code,metric_name,year,month,value&data_type=eq.traffic"),
      ]);
      setRevenueData(rev);
      setTrafficData(trf);
      setLoading(false);
    }
    load();
  }, []);

  const availableYears = useMemo(() => {
    const yrs = new Set([...revenueData.map(d => d.year), ...trafficData.map(d => d.year)]);
    return [...yrs].sort((a, b) => b - a);
  }, [revenueData, trafficData]);

  const activeMonths = useMemo(() => {
    if (viewMode === "full") return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    return [...actualMonths].sort((a, b) => a - b);
  }, [viewMode, actualMonths]);

  function sumRevenue(year: number, months: number[]): number {
    return revenueData.filter(d => d.year === year && months.includes(d.month)).reduce((s, d) => s + Number(d.value), 0);
  }

  function sumTraffic(year: number, months: number[], metric: string): number {
    return trafficData.filter(d => d.year === year && months.includes(d.month) && d.metric_name === metric).reduce((s, d) => s + Number(d.value), 0);
  }

  const curRevenue = sumRevenue(selectedYear, activeMonths);
  const prevRevenue = sumRevenue(selectedYear - 1, activeMonths);
  const revGrowth = prevRevenue > 0 ? ((curRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const curPax = sumTraffic(selectedYear, activeMonths, "Total Passengers");
  const prevPax = sumTraffic(selectedYear - 1, activeMonths, "Total Passengers");
  const paxGrowth = prevPax > 0 ? ((curPax - prevPax) / prevPax) * 100 : 0;

  const curMov = sumTraffic(selectedYear, activeMonths, "Total Movements");
  const prevMov = sumTraffic(selectedYear - 1, activeMonths, "Total Movements");
  const movGrowth = prevMov > 0 ? ((curMov - prevMov) / prevMov) * 100 : 0;

  const revPerPax = curPax > 0 ? curRevenue / curPax : 0;
  const prevRevPerPax = prevPax > 0 ? prevRevenue / prevPax : 0;
  const rppGrowth = prevRevPerPax > 0 ? ((revPerPax - prevRevPerPax) / prevRevPerPax) * 100 : 0;

  const paxCounter = useCountUp(Math.round(curPax / 1000000));
  const movCounter = useCountUp(Math.round(curMov / 1000));
  const revCounter = useCountUp(Math.round(convert(curRevenue, "USD") / 1000000));
  const rppCounter = useCountUp(Math.round(convert(revPerPax, "USD") * 100));

  const monthlyRevenue = useMemo(() => {
    return MONTHS.map((_, i) => {
      const m = i + 1;
      return revenueData.filter(d => d.year === selectedYear && d.month === m).reduce((s, d) => s + Number(d.value), 0);
    });
  }, [revenueData, selectedYear]);

  const prevMonthlyRevenue = useMemo(() => {
    return MONTHS.map((_, i) => {
      const m = i + 1;
      return revenueData.filter(d => d.year === selectedYear - 1 && d.month === m).reduce((s, d) => s + Number(d.value), 0);
    });
  }, [revenueData, selectedYear]);

  const maxMonthly = Math.max(...monthlyRevenue, 1);

  const revenueByLine = useMemo(() => {
    const byLine: Record<string, number> = {};
    for (const d of revenueData) {
      if (d.year === selectedYear && activeMonths.includes(d.month)) {
        byLine[d.metric_name] = (byLine[d.metric_name] || 0) + Number(d.value);
      }
    }
    return Object.entries(byLine).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [revenueData, selectedYear, activeMonths]);

  const totalLineRev = revenueByLine.reduce((s, l) => s + l.revenue, 0);
  const lineColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  function MetricCard({ label, value, suffix, growth, counterRef }: { label: string; value: number; suffix: string; growth: number; counterRef: React.RefObject<HTMLDivElement | null> }) {
    const isPositive = growth >= 0;
    return (
      <div ref={counterRef} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
        <p className="text-2xl font-bold text-gray-900 font-mono mb-2">{value.toLocaleString()}{suffix}</p>
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPositive ? "+" : ""}{growth.toFixed(1)}% vs {selectedYear - 1}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">
            {viewMode === "ytd" ? `YTD (${actualMonths.size} actual months)` : "Full Year"} — {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setViewMode("full")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "full" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}>Full Year</button>
            <button onClick={() => setViewMode("ytd")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "ytd" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}>YTD</button>
          </div>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-900 outline-none">
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Passengers" value={paxCounter.value} suffix="M" growth={paxGrowth} counterRef={paxCounter.ref} />
        <MetricCard label="Aircraft Movements" value={movCounter.value} suffix="K" growth={movGrowth} counterRef={movCounter.ref} />
        <MetricCard label="Total Revenue" value={revCounter.value} suffix={`M ${symbol !== "$" ? symbol : ""}`} growth={revGrowth} counterRef={revCounter.ref} />
        <MetricCard label="Revenue per Pax" value={rppCounter.value / 100} suffix={` ${symbol !== "$" ? symbol : ""}`} growth={rppGrowth} counterRef={rppCounter.ref} />
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Revenue — {selectedYear}</h2>
        <div className="flex items-end gap-2 h-64">
          {MONTHS.map((m, i) => {
            const val = monthlyRevenue[i];
            const prevVal = prevMonthlyRevenue[i];
            const pct = (val / maxMonthly) * 100;
            const yoyDelta = prevVal > 0 ? ((val - prevVal) / prevVal) * 100 : 0;
            const isActual = actualMonths.has(i + 1);
            const isInScope = activeMonths.includes(i + 1);

            return (
              <div key={m} className={`flex-1 flex flex-col items-center group relative h-full ${!isInScope && viewMode === "ytd" ? "opacity-30" : ""}`}>
                <div className="w-full flex-1 flex flex-col items-center justify-end overflow-hidden">
                  <span className="text-[9px] text-gray-500 font-mono mb-1 shrink-0">{symbol}{Math.round(convert(val, "USD") / 1000000)}M</span>
                  {val > 0 ? (
                    <div
                      className={`w-full rounded-t-md transition-colors duration-300 cursor-pointer animate-[growUp_0.8s_ease-out_forwards] ${isActual ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-300 hover:bg-blue-400"}`}
                      style={{ height: `${pct}%`, minHeight: 4, animationDelay: `${i * 80}ms`, opacity: 0 }}
                    />
                  ) : (
                    <div className="w-full rounded-t-md bg-gray-100" style={{ minHeight: 4 }} />
                  )}
                </div>
                <span className="text-[10px] text-gray-500 shrink-0 mt-1">{m}</span>

                {val > 0 && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                    <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl">
                      <p className="font-bold mb-1">{m} {selectedYear}: {symbol}{Math.round(convert(val, "USD") / 1000000).toLocaleString()}M</p>
                      {prevVal > 0 && (
                        <p className={yoyDelta >= 0 ? "text-emerald-400" : "text-red-400"}>
                          vs {selectedYear - 1}: {yoyDelta >= 0 ? "+" : ""}{yoyDelta.toFixed(1)}%
                        </p>
                      )}
                      <p className="text-gray-400">{isActual ? "Actual" : "Forecast/Budget"}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 justify-center text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500" /> Actual</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-300" /> Forecast</span>
        </div>
        <style>{`@keyframes growUp { from { transform: scaleY(0); transform-origin: bottom; opacity: 0; } to { transform: scaleY(1); transform-origin: bottom; opacity: 1; } }`}</style>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Line */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Revenue by Line</h2>
          {revenueByLine.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No revenue data for {selectedYear}</p>
          ) : (
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
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, backgroundColor: lineColors[i % lineColors.length] }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{pct.toFixed(1)}% of total</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* YoY Comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Year-over-Year</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Metric</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{selectedYear - 1}</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{selectedYear}</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Change</th>
                </tr>
              </thead>
              <tbody>
                {/* Traffic metrics */}
                {[
                  { name: "Total Passengers", prev: prevPax, cur: curPax, fmt: (v: number) => `${(v / 1000000).toFixed(1)}M` },
                  { name: "Total Movements", prev: prevMov, cur: curMov, fmt: (v: number) => `${(v / 1000).toFixed(0)}K` },
                ].map(row => {
                  const delta = row.prev > 0 ? ((row.cur - row.prev) / row.prev) * 100 : 0;
                  return (
                    <tr key={row.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-medium text-gray-900">{row.name}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500 font-mono">{row.fmt(row.prev)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-semibold">{row.fmt(row.cur)}</td>
                      <td className={`px-3 py-2.5 text-right font-mono font-semibold ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}%</td>
                    </tr>
                  );
                })}

                {/* Separator */}
                <tr><td colSpan={4} className="py-1"><div className="border-t border-gray-200" /></td></tr>

                {/* Revenue lines in descending order */}
                {revenueByLine.map(line => {
                  const prevLineRev = revenueData.filter(d => d.year === selectedYear - 1 && activeMonths.includes(d.month) && d.metric_name === line.name).reduce((s, d) => s + Number(d.value), 0);
                  const delta = prevLineRev > 0 ? ((line.revenue - prevLineRev) / prevLineRev) * 100 : 0;
                  return (
                    <tr key={line.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-medium text-gray-700">{line.name}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500 font-mono">{symbol}{Math.round(convert(prevLineRev, "USD") / 1000000).toLocaleString()}M</td>
                      <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-semibold">{symbol}{Math.round(convert(line.revenue, "USD") / 1000000).toLocaleString()}M</td>
                      <td className={`px-3 py-2.5 text-right font-mono font-semibold ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}%</td>
                    </tr>
                  );
                })}

                {/* Total Revenue - highlighted */}
                <tr className="bg-blue-50/50 border-t-2 border-blue-200">
                  <td className="px-3 py-2.5 font-bold text-gray-900">Total Revenue</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 font-mono font-semibold">{symbol}{Math.round(convert(prevRevenue, "USD") / 1000000).toLocaleString()}M</td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-bold">{symbol}{Math.round(convert(curRevenue, "USD") / 1000000).toLocaleString()}M</td>
                  <td className={`px-3 py-2.5 text-right font-mono font-bold ${revGrowth >= 0 ? "text-emerald-600" : "text-red-500"}`}>{revGrowth >= 0 ? "+" : ""}{revGrowth.toFixed(1)}%</td>
                </tr>

                {/* Revenue per Pax */}
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-3 py-2.5 font-medium text-gray-700 italic">Revenue per Pax</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 font-mono">{symbol}{convert(prevRevPerPax, "USD").toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-semibold">{symbol}{convert(revPerPax, "USD").toFixed(2)}</td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${rppGrowth >= 0 ? "text-emerald-600" : "text-red-500"}`}>{rppGrowth >= 0 ? "+" : ""}{rppGrowth.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
