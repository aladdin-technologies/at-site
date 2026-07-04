"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Download } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface TrafficRow {
  year: number; month: number;
  arr_pax_direct: number; dep_pax_direct: number; transfer_pax: number; transit_pax: number;
  total_movements: number; total_mtow_tonnes: number;
  forecast_airlines: { code: string; name: string };
  forecast_airports: { code: string; name: string };
}

interface YieldRow {
  year: number; month: number; yield_rate: number; currency: string;
  forecast_revenue_lines: { name: string; charge_basis: string; traffic_metric: string };
  forecast_airports: { code: string; name: string };
}

function getTrafficValue(t: TrafficRow, metric: string): number {
  if (metric === "dep_pax_direct") return t.dep_pax_direct;
  if (metric === "total_movements") return t.total_movements;
  if (metric === "total_mtow_tonnes") return t.total_mtow_tonnes;
  return t.dep_pax_direct;
}

function fmt(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function RevenueMatrixPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [traffic, setTraffic] = useState<TrafficRow[]>([]);
  const [yields, setYields] = useState<YieldRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedAirport, setSelectedAirport] = useState("ALL");
  const [selectedAirline, setSelectedAirline] = useState("ALL");

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/aero/login"); return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
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
  }, [authorized]);

  const years = useMemo(() => [...new Set(traffic.map(t => t.year))].sort(), [traffic]);
  const airports = useMemo(() => {
    const set = new Map<string, string>();
    traffic.forEach(t => { const a = t.forecast_airports as any; if (a) set.set(a.code, a.name); });
    return [...set.entries()];
  }, [traffic]);
  const airlines = useMemo(() => {
    const set = new Map<string, string>();
    traffic.forEach(t => { const a = t.forecast_airlines as any; if (a) set.set(a.code, a.name); });
    return [...set.entries()];
  }, [traffic]);
  const revLines = useMemo(() => {
    const set = new Map<string, { name: string; metric: string }>();
    yields.forEach(y => { const r = y.forecast_revenue_lines as any; if (r) set.set(r.name, { name: r.name, metric: r.traffic_metric }); });
    return [...set.values()];
  }, [yields]);

  // Compute revenue matrix: revenue line × month
  const matrix = useMemo(() => {
    const yearTraffic = traffic.filter(t => t.year === selectedYear && (selectedAirport === "ALL" || (t.forecast_airports as any)?.code === selectedAirport) && (selectedAirline === "ALL" || (t.forecast_airlines as any)?.code === selectedAirline));
    const yearYields = yields.filter(y => y.year === selectedYear && (selectedAirport === "ALL" || (y.forecast_airports as any)?.code === selectedAirport));

    return revLines.map(rl => {
      const monthly: number[] = [];
      let total = 0;
      for (let m = 1; m <= 12; m++) {
        let rev = 0;
        for (const t of yearTraffic.filter(t => t.month === m)) {
          const aptCode = (t.forecast_airports as any)?.code;
          const matchYield = yearYields.find(y => (y.forecast_airports as any)?.code === aptCode && y.month === m && (y.forecast_revenue_lines as any)?.name === rl.name);
          if (matchYield) {
            rev += getTrafficValue(t, rl.metric) * matchYield.yield_rate;
          }
        }
        monthly.push(rev);
        total += rev;
      }
      return { name: rl.name, monthly, total };
    });
  }, [traffic, yields, selectedYear, selectedAirport, selectedAirline, revLines]);

  const grandTotal = matrix.reduce((s, r) => s + r.total, 0);
  const monthTotals = Array.from({ length: 12 }, (_, i) => matrix.reduce((s, r) => s + r.monthly[i], 0));

  if (!authorized) return null;
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900"><ArrowLeft size={18} /></button>
            <span className="text-sm font-bold text-gray-900">Revenue Matrix</span>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedAirport} onChange={e => setSelectedAirport(e.target.value)} className="px-2 py-1 rounded-lg text-xs border border-gray-200 bg-white">
              <option value="ALL">All Airports</option>
              {airports.map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}
            </select>
            <select value={selectedAirline} onChange={e => setSelectedAirline(e.target.value)} className="px-2 py-1 rounded-lg text-xs border border-gray-200 bg-white">
              <option value="ALL">All Airlines</option>
              {airlines.map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="px-2 py-1 rounded-lg text-xs border border-gray-200 bg-white">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 sticky left-0 bg-gray-50 min-w-[180px]">Revenue Line</th>
                  {MONTHS.map(m => <th key={m} className="text-right px-3 py-3 font-semibold text-gray-500 min-w-[80px]">{m}</th>)}
                  <th className="text-right px-4 py-3 font-bold text-gray-900 min-w-[100px] bg-blue-50">Total</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map(row => (
                  <tr key={row.name} className="border-b border-gray-100 hover:bg-blue-50/30">
                    <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white">{row.name}</td>
                    {row.monthly.map((v, i) => (
                      <td key={i} className="text-right px-3 py-3 font-mono text-gray-700">{fmt(v)}</td>
                    ))}
                    <td className="text-right px-4 py-3 font-mono font-bold text-gray-900 bg-blue-50">{fmt(row.total)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-gray-50">Grand Total</td>
                  {monthTotals.map((v, i) => (
                    <td key={i} className="text-right px-3 py-3 font-mono font-bold text-gray-900">{fmt(v)}</td>
                  ))}
                  <td className="text-right px-4 py-3 font-mono font-bold text-blue-600 text-sm bg-blue-50">{fmt(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
