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
  const [selectedAirport, setSelectedAirport] = useState("ALL");
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

  const availableAirports = useMemo(() => {
    const codes = new Set([...revenueData.map(d => d.airport_code), ...trafficData.map(d => d.airport_code)]);
    return [...codes].sort();
  }, [revenueData, trafficData]);

  const filteredRevenue = useMemo(() => selectedAirport === "ALL" ? revenueData : revenueData.filter(d => d.airport_code === selectedAirport), [revenueData, selectedAirport]);
  const filteredTraffic = useMemo(() => selectedAirport === "ALL" ? trafficData : trafficData.filter(d => d.airport_code === selectedAirport), [trafficData, selectedAirport]);

  const activeMonths = useMemo(() => {
    if (viewMode === "full") return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    return [...actualMonths].sort((a, b) => a - b);
  }, [viewMode, actualMonths]);

  function sumRevenue(year: number, months: number[]): number {
    return filteredRevenue.filter(d => d.year === year && months.includes(d.month)).reduce((s, d) => s + Number(d.value), 0);
  }

  function sumTraffic(year: number, months: number[], metric: string): number {
    return filteredTraffic.filter(d => d.year === year && months.includes(d.month) && d.metric_name === metric).reduce((s, d) => s + Number(d.value), 0);
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
      return filteredRevenue.filter(d => d.year === selectedYear && d.month === m).reduce((s, d) => s + Number(d.value), 0);
    });
  }, [filteredRevenue, selectedYear]);

  const prevMonthlyRevenue = useMemo(() => {
    return MONTHS.map((_, i) => {
      const m = i + 1;
      return filteredRevenue.filter(d => d.year === selectedYear - 1 && d.month === m).reduce((s, d) => s + Number(d.value), 0);
    });
  }, [filteredRevenue, selectedYear]);

  const maxMonthly = Math.max(...monthlyRevenue, 1);

  const revenueByLine = useMemo(() => {
    const byLine: Record<string, number> = {};
    for (const d of filteredRevenue) {
      if (d.year === selectedYear && activeMonths.includes(d.month)) {
        byLine[d.metric_name] = (byLine[d.metric_name] || 0) + Number(d.value);
      }
    }
    return Object.entries(byLine).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredRevenue, selectedYear, activeMonths]);

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
          <button
            onClick={() => setViewMode(viewMode === "full" ? "ytd" : "full")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className={`text-xs font-medium ${viewMode === "ytd" ? "text-gray-900" : "text-gray-400"}`}>YTD</span>
            <div className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 ${viewMode === "full" ? "bg-emerald-500" : "bg-gray-300"}`}>
              <div className={`w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${viewMode === "full" ? "translate-x-[18px]" : "translate-x-0"}`} />
            </div>
            <span className={`text-xs font-medium ${viewMode === "full" ? "text-gray-900" : "text-gray-400"}`}>Full Year</span>
          </button>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-900 outline-none">
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Passengers" value={paxCounter.value} suffix="m" growth={paxGrowth} counterRef={paxCounter.ref} />
        <MetricCard label="Aircraft Movements" value={movCounter.value} suffix="k" growth={movGrowth} counterRef={movCounter.ref} />
        <MetricCard label="Total Revenue" value={revCounter.value} suffix="m" growth={revGrowth} counterRef={revCounter.ref} />
        <MetricCard label="Revenue per Pax" value={rppCounter.value / 100} suffix="" growth={rppGrowth} counterRef={rppCounter.ref} />
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
                  <span className="text-[9px] text-gray-500 font-mono mb-1 shrink-0">{Math.round(convert(val, "USD") / 1000000)}m</span>
                  {val > 0 ? (
                    <div
                      className="w-full rounded-t-md bg-blue-500 hover:bg-blue-600 transition-colors duration-300 cursor-pointer animate-[growUp_0.8s_ease-out_forwards]"
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
                      <p className="font-bold mb-1">{m} {selectedYear}: {Math.round(convert(val, "USD") / 1000000).toLocaleString()}m</p>
                      {prevVal > 0 && (
                        <p className={yoyDelta >= 0 ? "text-emerald-400" : "text-red-400"}>
                          vs {selectedYear - 1}: {yoyDelta >= 0 ? "+" : ""}{yoyDelta.toFixed(1)}%
                        </p>
                      )}
                      <p className="text-gray-400">Actual</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <style>{`@keyframes growUp { from { transform: scaleY(0); transform-origin: bottom; opacity: 0; } to { transform: scaleY(1); transform-origin: bottom; opacity: 1; } }`}</style>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Line — Pie Charts per Airport */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Revenue by Line</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {["ALL", ...availableAirports].map(aptCode => {
              const aptRevData = aptCode === "ALL" ? revenueData : revenueData.filter(d => d.airport_code === aptCode);
              const byLine: Record<string, number> = {};
              for (const d of aptRevData) {
                if (d.year === selectedYear && activeMonths.includes(d.month)) {
                  byLine[d.metric_name] = (byLine[d.metric_name] || 0) + Number(d.value);
                }
              }
              const lines = Object.entries(byLine).map(([name, rev]) => ({ name, rev })).sort((a, b) => b.rev - a.rev);
              const total = lines.reduce((s, l) => s + l.rev, 0);
              if (total === 0) return null;

              let cumAngle = 0;
              const slices = lines.map((l, i) => {
                const pct = l.rev / total;
                const startAngle = cumAngle;
                cumAngle += pct * 360;
                return { ...l, pct, startAngle, endAngle: cumAngle, color: lineColors[i % lineColors.length] };
              });

              function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
                const rad = (deg - 90) * Math.PI / 180;
                return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
              }

              return (
                <div key={aptCode} className="text-center">
                  <p className="text-xs font-bold text-gray-900 mb-3 font-mono">{aptCode === "ALL" ? "All Airports" : aptCode}</p>
                  <svg viewBox="0 0 200 200" className="w-36 h-36 mx-auto mb-3">
                    {slices.map((s, i) => {
                      if (s.pct >= 0.999) {
                        return <circle key={i} cx="100" cy="100" r="80" fill={s.color} />;
                      }
                      const start = polarToCartesian(100, 100, 80, s.startAngle);
                      const end = polarToCartesian(100, 100, 80, s.endAngle);
                      const largeArc = s.pct > 0.5 ? 1 : 0;
                      return <path key={i} d={`M100,100 L${start.x},${start.y} A80,80 0 ${largeArc} 1 ${end.x},${end.y} Z`} fill={s.color} stroke="white" strokeWidth="1.5" />;
                    })}
                    <circle cx="100" cy="100" r="45" fill="white" />
                    <text x="100" y="96" textAnchor="middle" className="text-sm font-bold fill-gray-900">{Math.round(convert(total, "USD") / 1000000).toLocaleString()}m</text>
                    <text x="100" y="112" textAnchor="middle" className="text-[9px] fill-gray-400">Total</text>
                  </svg>
                  <div className="space-y-1 text-left">
                    {slices.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-[10px] text-gray-600 flex-1 truncate">{s.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{(s.pct * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* YoY Comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Year-over-Year</h2>
            <div className="flex items-center gap-1 overflow-x-auto max-w-[300px]">
              <button onClick={() => setSelectedAirport("ALL")} className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${selectedAirport === "ALL" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
              {availableAirports.map(code => (
                <button key={code} onClick={() => setSelectedAirport(code)} className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold whitespace-nowrap transition-colors ${selectedAirport === code ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{code}</button>
              ))}
            </div>
          </div>
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
                  { name: "Total Passengers", prev: prevPax, cur: curPax, fmt: (v: number) => `${(v / 1000000).toFixed(1)}m` },
                  { name: "Total Movements", prev: prevMov, cur: curMov, fmt: (v: number) => `${(v / 1000).toFixed(0)}k` },
                ].map(row => {
                  const delta = row.prev > 0 ? ((row.cur - row.prev) / row.prev) * 100 : 0;
                  return (
                    <tr key={row.name} className="bg-blue-50/50 border-b border-blue-100">
                      <td className="px-3 py-2.5 font-bold text-gray-900">{row.name}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500 font-mono font-semibold">{row.fmt(row.prev)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-bold">{row.fmt(row.cur)}</td>
                      <td className={`px-3 py-2.5 text-right font-mono font-bold ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}%</td>
                    </tr>
                  );
                })}

                {/* Separator */}
                <tr><td colSpan={4} className="py-1"><div className="border-t border-gray-200" /></td></tr>

                {/* Revenue lines in descending order */}
                {revenueByLine.map(line => {
                  const prevLineRev = filteredRevenue.filter(d => d.year === selectedYear - 1 && activeMonths.includes(d.month) && d.metric_name === line.name).reduce((s, d) => s + Number(d.value), 0);
                  const delta = prevLineRev > 0 ? ((line.revenue - prevLineRev) / prevLineRev) * 100 : 0;
                  return (
                    <tr key={line.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-medium text-gray-700">{line.name}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500 font-mono">{Math.round(convert(prevLineRev, "USD") / 1000000).toLocaleString()}m</td>
                      <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-semibold">{Math.round(convert(line.revenue, "USD") / 1000000).toLocaleString()}m</td>
                      <td className={`px-3 py-2.5 text-right font-mono font-semibold ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}%</td>
                    </tr>
                  );
                })}

                {/* Total Revenue - highlighted */}
                <tr className="bg-blue-50/50 border-t-2 border-blue-200">
                  <td className="px-3 py-2.5 font-bold text-gray-900">Total Revenue</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 font-mono font-semibold">{Math.round(convert(prevRevenue, "USD") / 1000000).toLocaleString()}m</td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-bold">{Math.round(convert(curRevenue, "USD") / 1000000).toLocaleString()}m</td>
                  <td className={`px-3 py-2.5 text-right font-mono font-bold ${revGrowth >= 0 ? "text-emerald-600" : "text-red-500"}`}>{revGrowth >= 0 ? "+" : ""}{revGrowth.toFixed(1)}%</td>
                </tr>

                {/* Revenue per Pax */}
                <tr className="bg-blue-50/50 border-t border-blue-200">
                  <td className="px-3 py-2.5 font-bold text-gray-900">Revenue per Pax</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 font-mono font-semibold">{convert(prevRevPerPax, "USD").toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-bold">{convert(revPerPax, "USD").toFixed(2)}</td>
                  <td className={`px-3 py-2.5 text-right font-mono font-bold ${rppGrowth >= 0 ? "text-emerald-600" : "text-red-500"}`}>{rppGrowth >= 0 ? "+" : ""}{rppGrowth.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
