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
  const animated = useRef(false);
  useEffect(() => {
    if (!target) { setValue(0); return; }
    if (animated.current && value === target) return;
    const start = performance.now();
    const from = animated.current ? value : 0;
    animated.current = true;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * ease));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return { value, ref };
}

export default function AnalyticsPage() {
  const [revenueData, setRevenueData] = useState<DataValue[]>([]);
  const [trafficData, setTrafficData] = useState<DataValue[]>([]);
  const [budgetRevData, setBudgetRevData] = useState<DataValue[]>([]);
  const [budgetTrfData, setBudgetTrfData] = useState<DataValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [viewMode, setViewMode] = useState<"full" | "ytd">("full");
  const [selectedAirport, setSelectedAirport] = useState("ALL");
  const [pieTooltip, setPieTooltip] = useState<{ name: string; value: number; pct: number; x: number; y: number } | null>(null);
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

      const [rev, trf, bRev, bTrf] = await Promise.all([
        fetchAll("select=airport_code,airline_code,metric_name,year,month,value&data_type=eq.revenue"),
        fetchAll("select=airport_code,airline_code,metric_name,year,month,value&data_type=eq.traffic"),
        fetchAll("select=airport_code,airline_code,metric_name,year,month,value&data_type=eq.budget_revenue"),
        fetchAll("select=airport_code,airline_code,metric_name,year,month,value&data_type=eq.budget_traffic"),
      ]);
      setRevenueData(rev);
      setTrafficData(trf);
      setBudgetRevData(bRev);
      setBudgetTrfData(bTrf);
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
  const filteredBudgetRev = useMemo(() => selectedAirport === "ALL" ? budgetRevData : budgetRevData.filter(d => d.airport_code === selectedAirport), [budgetRevData, selectedAirport]);
  const filteredBudgetTrf = useMemo(() => selectedAirport === "ALL" ? budgetTrfData : budgetTrfData.filter(d => d.airport_code === selectedAirport), [budgetTrfData, selectedAirport]);

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
      {/* Combined Revenue + RPP Chart */}
      {(() => {
        const monthlyPax = MONTHS.map((_, i) => filteredTraffic.filter(d => d.year === selectedYear && d.month === i + 1 && d.metric_name === "Total Passengers").reduce((s, d) => s + Number(d.value), 0));
        const monthlyRpp = MONTHS.map((_, i) => monthlyPax[i] > 0 ? monthlyRevenue[i] / monthlyPax[i] : 0);
        const maxRpp = Math.max(...monthlyRpp.filter(v => v > 0), 1);
        const minRpp = Math.min(...monthlyRpp.filter(v => v > 0), 0);
        const rppRange = maxRpp - minRpp || 1;

        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Monthly Revenue — {selectedYear}</h2>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500" /> Revenue</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1 rounded bg-purple-500" /> RPP</span>
              </div>
            </div>
            <div className="relative">
              {/* Bars */}
              <div className="flex items-end gap-2 h-72">
                {MONTHS.map((m, i) => {
                  const val = monthlyRevenue[i];
                  const prevVal = prevMonthlyRevenue[i];
                  const pct = (val / maxMonthly) * 100;
                  const yoyDelta = prevVal > 0 ? ((val - prevVal) / prevVal) * 100 : 0;
                  const isInScope = activeMonths.includes(i + 1);

                  return (
                    <div key={m} className={`flex-1 flex flex-col items-center group relative h-full ${!isInScope && viewMode === "ytd" ? "opacity-30" : ""}`}>
                      <div className="w-full flex-1 flex flex-col items-center justify-end overflow-hidden">
                        <span className="text-[9px] text-gray-500 font-mono mb-1 shrink-0">{Math.round(convert(val, "USD") / 1000000)}m</span>
                        {val > 0 ? (
                          <div className="w-full rounded-t-md bg-blue-500 hover:bg-blue-600 transition-colors duration-300 cursor-pointer animate-[growUp_0.8s_ease-out_forwards]" style={{ height: `${pct}%`, minHeight: 4, animationDelay: `${i * 80}ms`, opacity: 0 }} />
                        ) : (
                          <div className="w-full rounded-t-md bg-gray-100" style={{ minHeight: 4 }} />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0 mt-1">{m}</span>
                      {val > 0 && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                          <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl">
                            <p className="font-bold mb-1">{m} {selectedYear}: {Math.round(convert(val, "USD") / 1000000).toLocaleString()}m</p>
                            {prevVal > 0 && <p className={yoyDelta >= 0 ? "text-emerald-400" : "text-red-400"}>vs {selectedYear - 1}: {yoyDelta >= 0 ? "+" : ""}{yoyDelta.toFixed(1)}%</p>}
                            {monthlyRpp[i] > 0 && <p className="text-purple-300">RPP: {convert(monthlyRpp[i], "USD").toFixed(0)}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* RPP line overlay */}
              <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: "calc(100% - 20px)" }}>
                {monthlyRpp.some(v => v > 0) && (() => {
                  const pts = monthlyRpp.map((v, i) => {
                    if (v <= 0) return null;
                    const x = ((i + 0.5) / 12) * 100;
                    const normalized = (v - minRpp) / rppRange;
                    const y = 85 - normalized * 55;
                    return { x, y, val: v };
                  }).filter(Boolean) as { x: number; y: number; val: number }[];
                  const polyline = pts.map(p => `${p.x}%,${p.y}%`).join(" ");
                  return (
                    <>
                      <polyline points={polyline} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((p, i) => (
                        <g key={i}>
                          <circle cx={`${p.x}%`} cy={`${p.y}%`} r="4" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                          <text x={`${p.x}%`} y={`${p.y - 4}%`} textAnchor="middle" fill="#7c3aed" style={{ fontSize: "10px", fontWeight: 600, fontFamily: "monospace" }}>{convert(p.val, "USD").toFixed(0)}</text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
            <style>{`@keyframes growUp { from { transform: scaleY(0); transform-origin: bottom; opacity: 0; } to { transform: scaleY(1); transform-origin: bottom; opacity: 1; } }`}</style>
          </div>
        );
      })()}

      <div className="space-y-8 mb-8">
        {/* Revenue by Line — Pie Charts per Airport */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Revenue by Line</h2>
          {(() => {
            const allPies = ["ALL", ...availableAirports].map(aptCode => {
              const aptRevData = aptCode === "ALL" ? revenueData : revenueData.filter(d => d.airport_code === aptCode);
              const byLine: Record<string, number> = {};
              for (const d of aptRevData) {
                if (d.year === selectedYear && activeMonths.includes(d.month)) {
                  byLine[d.metric_name] = (byLine[d.metric_name] || 0) + Number(d.value);
                }
              }
              const lines = Object.entries(byLine).map(([name, rev]) => ({ name, rev })).sort((a, b) => b.rev - a.rev);
              const total = lines.reduce((s, l) => s + l.rev, 0);
              let cumAngle = 0;
              const slices = lines.map((l, i) => {
                const pct = total > 0 ? l.rev / total : 0;
                const startAngle = cumAngle;
                cumAngle += pct * 360;
                return { ...l, pct, startAngle, endAngle: cumAngle, color: lineColors[i % lineColors.length] };
              });
              return { aptCode, slices, total };
            }).filter(p => p.total > 0);

            const legendSlices = allPies[0]?.slices || [];

            function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
              const rad = (deg - 90) * Math.PI / 180;
              return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
            }

            return (
              <>
                <div className="flex items-center justify-center gap-8 flex-wrap mb-6">
                  {allPies.map((pie, pieIdx) => (
                    <div key={pie.aptCode} className="text-center group">
                      <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto drop-shadow-sm" style={{ animation: `spinIn 0.8s ease-out ${pieIdx * 0.2}s both` }}>
                        {pie.slices.map((s, i) => {
                          if (s.pct >= 0.999) {
                            return <circle key={i} cx="100" cy="100" r="85" fill={s.color} />;
                          }
                          const start = polarToCartesian(100, 100, 85, s.startAngle);
                          const end = polarToCartesian(100, 100, 85, s.endAngle);
                          const largeArc = s.pct > 0.5 ? 1 : 0;
                          return (
                            <path
                              key={i}
                              d={`M100,100 L${start.x},${start.y} A85,85 0 ${largeArc} 1 ${end.x},${end.y} Z`}
                              fill={s.color}
                              stroke="white"
                              strokeWidth="2"
                              className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                              style={{ opacity: 0, animation: `sliceIn 0.5s ease-out ${pieIdx * 0.2 + i * 0.1}s forwards`, transformOrigin: "100px 100px" }}
                              onMouseEnter={(e) => {
                                const rect = (e.target as SVGPathElement).closest("svg")!.getBoundingClientRect();
                                setPieTooltip({ name: s.name, value: s.rev, pct: s.pct, x: rect.left + rect.width / 2, y: rect.top - 10 });
                              }}
                              onMouseLeave={() => setPieTooltip(null)}
                            />
                          );
                        })}
                        <circle cx="100" cy="100" r="52" fill="white" className="drop-shadow-sm" />
                        <text x="100" y="92" textAnchor="middle" className="fill-gray-900" style={{ fontSize: "18px", fontWeight: 700 }}>{Math.round(convert(pie.total, "USD") / 1000000).toLocaleString()}m</text>
                        <text x="100" y="114" textAnchor="middle" className="fill-gray-400" style={{ fontSize: "11px" }}>{pie.aptCode === "ALL" ? "All Airports" : pie.aptCode}</text>
                      </svg>
                    </div>
                  ))}
                </div>
                <style>{`
                  @keyframes spinIn { from { opacity: 0; transform: rotate(-90deg) scale(0.6); } to { opacity: 1; transform: rotate(0deg) scale(1); } }
                  @keyframes sliceIn { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
                `}</style>
                <div className="flex items-center justify-center gap-5 flex-wrap">
                  {legendSlices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-gray-600 font-medium">{s.name}</span>
                    </div>
                  ))}
                </div>
                {pieTooltip && (
                  <div className="fixed z-50 pointer-events-none" style={{ left: pieTooltip.x, top: pieTooltip.y, transform: "translate(-50%, -100%)" }}>
                    <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-[11px] whitespace-nowrap shadow-xl">
                      <p className="font-bold">{pieTooltip.name}</p>
                      <p>{Math.round(convert(pieTooltip.value, "USD") / 1000000).toLocaleString()}m · {(pieTooltip.pct * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Actual vs Budget */}
        {(() => {
          const budRevTotal = filteredBudgetRev.filter(d => d.year === selectedYear && activeMonths.includes(d.month)).reduce((s, d) => s + Number(d.value), 0);
          const budPax = filteredBudgetTrf.filter(d => d.year === selectedYear && activeMonths.includes(d.month) && d.metric_name === "Total Passengers").reduce((s, d) => s + Number(d.value), 0);
          const budMov = filteredBudgetTrf.filter(d => d.year === selectedYear && activeMonths.includes(d.month) && d.metric_name === "Total Movements").reduce((s, d) => s + Number(d.value), 0);
          const budRpp = budPax > 0 ? budRevTotal / budPax : 0;
          const hasBudget = budRevTotal > 0 || budPax > 0;

          const budgetByLine = revenueByLine.map(line => ({
            name: line.name,
            actual: line.revenue,
            budget: filteredBudgetRev.filter(d => d.year === selectedYear && activeMonths.includes(d.month) && d.metric_name === line.name).reduce((s, d) => s + Number(d.value), 0),
          }));

          function variance(actual: number, budget: number) {
            if (budget === 0) return 0;
            return ((actual - budget) / budget) * 100;
          }

          return (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-gray-900">Actual vs Budget — {selectedYear}</h2>
                <div className="flex items-center gap-1 overflow-x-auto max-w-[300px]">
                  <button onClick={() => setSelectedAirport("ALL")} className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${selectedAirport === "ALL" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
                  {availableAirports.map(code => (
                    <button key={code} onClick={() => setSelectedAirport(code)} className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold whitespace-nowrap transition-colors ${selectedAirport === code ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{code}</button>
                  ))}
                </div>
              </div>
              {!hasBudget ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-1">No budget available for {selectedYear}</p>
                  <p className="text-xs text-gray-400">Prepare your budget in the Budget tab to enable this comparison</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Metric</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Budget</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Actual</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-blue-50/50 border-b border-blue-100">
                        <td className="px-3 py-2.5 font-bold text-gray-900">Total Passengers</td>
                        <td className="px-3 py-2.5 text-right text-gray-500 font-mono font-semibold">{(budPax / 1000000).toFixed(1)}m</td>
                        <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-bold">{(curPax / 1000000).toFixed(1)}m</td>
                        <td className={`px-3 py-2.5 text-right font-mono font-bold ${variance(curPax, budPax) >= 0 ? "text-emerald-600" : "text-red-500"}`}>{variance(curPax, budPax) >= 0 ? "+" : ""}{variance(curPax, budPax).toFixed(1)}%</td>
                      </tr>
                      <tr className="bg-blue-50/50 border-b border-blue-100">
                        <td className="px-3 py-2.5 font-bold text-gray-900">Total Movements</td>
                        <td className="px-3 py-2.5 text-right text-gray-500 font-mono font-semibold">{(budMov / 1000).toFixed(0)}k</td>
                        <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-bold">{(curMov / 1000).toFixed(0)}k</td>
                        <td className={`px-3 py-2.5 text-right font-mono font-bold ${variance(curMov, budMov) >= 0 ? "text-emerald-600" : "text-red-500"}`}>{variance(curMov, budMov) >= 0 ? "+" : ""}{variance(curMov, budMov).toFixed(1)}%</td>
                      </tr>
                      <tr><td colSpan={4} className="py-1"><div className="border-t border-gray-200" /></td></tr>
                      {budgetByLine.map(line => {
                        const v = variance(line.actual, line.budget);
                        return (
                          <tr key={line.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-3 py-2.5 font-medium text-gray-700">{line.name}</td>
                            <td className="px-3 py-2.5 text-right text-gray-500 font-mono">{Math.round(convert(line.budget, "USD") / 1000000).toLocaleString()}m</td>
                            <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-semibold">{Math.round(convert(line.actual, "USD") / 1000000).toLocaleString()}m</td>
                            <td className={`px-3 py-2.5 text-right font-mono font-semibold ${v >= 0 ? "text-emerald-600" : "text-red-500"}`}>{v >= 0 ? "+" : ""}{v.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-blue-50/50 border-t-2 border-blue-200">
                        <td className="px-3 py-2.5 font-bold text-gray-900">Total Revenue</td>
                        <td className="px-3 py-2.5 text-right text-gray-500 font-mono font-semibold">{Math.round(convert(budRevTotal, "USD") / 1000000).toLocaleString()}m</td>
                        <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-bold">{Math.round(convert(curRevenue, "USD") / 1000000).toLocaleString()}m</td>
                        <td className={`px-3 py-2.5 text-right font-mono font-bold ${variance(curRevenue, budRevTotal) >= 0 ? "text-emerald-600" : "text-red-500"}`}>{variance(curRevenue, budRevTotal) >= 0 ? "+" : ""}{variance(curRevenue, budRevTotal).toFixed(1)}%</td>
                      </tr>
                      <tr className="bg-blue-50/50 border-t border-blue-200">
                        <td className="px-3 py-2.5 font-bold text-gray-900">Revenue per Pax</td>
                        <td className="px-3 py-2.5 text-right text-gray-500 font-mono font-semibold">{convert(budRpp, "USD").toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right text-gray-900 font-mono font-bold">{convert(revPerPax, "USD").toFixed(2)}</td>
                        <td className={`px-3 py-2.5 text-right font-mono font-bold ${variance(revPerPax, budRpp) >= 0 ? "text-emerald-600" : "text-red-500"}`}>{variance(revPerPax, budRpp) >= 0 ? "+" : ""}{variance(revPerPax, budRpp).toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}
