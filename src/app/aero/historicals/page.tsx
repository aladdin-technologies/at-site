"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Download, Upload } from "lucide-react";

interface TrafficRow {
  year: number; month: number;
  arr_pax_direct: number; dep_pax_direct: number; transfer_pax: number; transit_pax: number;
  total_movements: number; total_mtow_tonnes: number;
  forecast_airlines: { code: string; name: string };
  forecast_airports: { code: string; name: string };
}
interface CfgAirport { id: string; code: string; name: string; }
interface CfgAirline { id: string; code: string; name: string; applicable_airports: string[] | null; }
interface CfgLine { id: string; name: string; applicable_airports: string[] | null; driver_id: string | null; }
interface CfgDriver { id: string; name: string; unit: string; }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HistoricalsPage() {
  const [traffic, setTraffic] = useState<TrafficRow[]>([]);
  const [cfgAirports, setCfgAirports] = useState<CfgAirport[]>([]);
  const [cfgAirlines, setCfgAirlines] = useState<CfgAirline[]>([]);
  const [cfgLines, setCfgLines] = useState<CfgLine[]>([]);
  const [cfgDrivers, setCfgDrivers] = useState<CfgDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [templateYear, setTemplateYear] = useState(2025);
  const [metric, setMetric] = useState<"pax" | "movements" | "mtow">("pax");

  useEffect(() => {
    async function load() {
      const [tRes, aRes, alRes, lRes, dRes] = await Promise.all([
        supabase.from("forecast_traffic").select("*, forecast_airlines(code, name), forecast_airports(code, name)"),
        supabase.from("forecast_airports").select("id, code, name").order("code"),
        supabase.from("forecast_airlines").select("id, code, name, applicable_airports").order("code"),
        supabase.from("forecast_charge_types").select("id, name, applicable_airports, driver_id").order("sort_order"),
        supabase.from("forecast_drivers").select("id, name, unit").order("name"),
      ]);
      setTraffic((tRes.data ?? []) as unknown as TrafficRow[]);
      setCfgAirports((aRes.data ?? []) as CfgAirport[]);
      setCfgAirlines((alRes.data ?? []) as CfgAirline[]);
      setCfgLines((lRes.data ?? []) as CfgLine[]);
      setCfgDrivers((dRes.data ?? []) as CfgDriver[]);
      setLoading(false);
    }
    load();
  }, []);

  const years = useMemo(() => [...new Set(traffic.map((t) => t.year))].sort(), [traffic]);
  const airports = useMemo(() => {
    const map = new Map<string, string>();
    traffic.forEach(t => {
      const code = (t.forecast_airports as any)?.code;
      const name = (t.forecast_airports as any)?.name;
      if (code) map.set(code, name);
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [traffic]);

  function generateRevenueTemplate() {
    const monthCols = MONTHS.map((m, i) => `${m}-${String(templateYear).slice(2)}`);
    const header = ["Airport", "Airline", "Revenue Line", ...monthCols];
    const rows = [header.join(",")];
    for (const apt of cfgAirports) {
      const airlinesAtApt = cfgAirlines.filter(al => { const a = al.applicable_airports || []; return a.length === 0 || a.includes(apt.id); });
      const linesAtApt = cfgLines.filter(l => { const a = l.applicable_airports || []; return a.length === 0 || a.includes(apt.id); });
      for (const al of airlinesAtApt) {
        for (const line of linesAtApt) {
          rows.push([apt.code, al.code, `"${line.name}"`, ...monthCols.map(() => "")].join(","));
        }
      }
    }
    return rows.join("\n");
  }

  function generateDriverTemplate() {
    const monthCols = MONTHS.map((m) => `${m}-${String(templateYear).slice(2)}`);
    const driverNames = cfgDrivers.map(d => d.name);
    const header = ["Airport", "Airline", ...driverNames.map(n => `"${n}"`)];
    const rows = [header.join(",")];
    for (const apt of cfgAirports) {
      const airlinesAtApt = cfgAirlines.filter(al => { const a = al.applicable_airports || []; return a.length === 0 || a.includes(apt.id); });
      for (const al of airlinesAtApt) {
        rows.push([apt.code, al.code, ...driverNames.map(() => "")].join(","));
      }
    }
    return rows.join("\n");
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const yearData = useMemo(() => traffic.filter(t => t.year === selectedYear), [traffic, selectedYear]);

  const monthlyTotals = useMemo(() => {
    return MONTHS.map((_, i) => {
      const monthRows = yearData.filter(t => t.month === i + 1);
      if (metric === "pax") {
        return monthRows.reduce((s, t) => s + t.arr_pax_direct + t.dep_pax_direct + t.transfer_pax + t.transit_pax, 0);
      } else if (metric === "movements") {
        return monthRows.reduce((s, t) => s + t.total_movements, 0);
      }
      return monthRows.reduce((s, t) => s + t.total_mtow_tonnes, 0);
    });
  }, [yearData, metric]);

  const maxMonthly = Math.max(...monthlyTotals, 1);

  const airportMonthly = useMemo(() => {
    return airports.map(apt => {
      const aptData = yearData.filter(t => (t.forecast_airports as any)?.code === apt.code);
      const months = MONTHS.map((_, i) => {
        const rows = aptData.filter(t => t.month === i + 1);
        if (metric === "pax") return rows.reduce((s, t) => s + t.arr_pax_direct + t.dep_pax_direct + t.transfer_pax + t.transit_pax, 0);
        if (metric === "movements") return rows.reduce((s, t) => s + t.total_movements, 0);
        return rows.reduce((s, t) => s + t.total_mtow_tonnes, 0);
      });
      return { ...apt, months, total: months.reduce((a, b) => a + b, 0) };
    });
  }, [airports, yearData, metric]);

  const formatValue = (v: number) => {
    if (metric === "pax") {
      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
      if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
      return v.toLocaleString();
    }
    if (metric === "movements") {
      if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
      return v.toLocaleString();
    }
    return `${(v / 1000).toFixed(0)}K t`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Historical Data</h1>
          <p className="text-sm text-gray-500">Upload and manage historical traffic and revenue data</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 outline-none"
          >
            <option value="pax">Passengers</option>
            <option value="movements">Movements</option>
            <option value="mtow">MTOW</option>
          </select>
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

      {/* Dynamic template generation */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Dynamic Templates</h2>
            <p className="text-xs text-gray-500">Generated from your Revenue Lines configuration ({cfgAirports.length} airports × {cfgAirlines.length} airlines × {cfgLines.length} revenue lines)</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Year:</label>
            <select value={templateYear} onChange={e => setTemplateYear(Number(e.target.value))} className="px-2 py-1 rounded-lg text-xs border border-gray-200 bg-white text-gray-900 outline-none">
              {[2023, 2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => downloadCSV(generateRevenueTemplate(), `revenue_template_${templateYear}.csv`)}
            disabled={cfgAirports.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <Download size={14} /> Revenue Template
            <span className="text-[9px] text-gray-400 ml-1">({cfgAirports.length * cfgAirlines.length * cfgLines.length} rows)</span>
          </button>
          <button
            onClick={() => downloadCSV(generateDriverTemplate(), `driver_template_${templateYear}.csv`)}
            disabled={cfgAirports.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <Download size={14} /> Driver Template
            <span className="text-[9px] text-gray-400 ml-1">({cfgAirports.length * cfgAirlines.length} rows × {cfgDrivers.length} drivers)</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
            <Upload size={14} /> Upload Data
          </button>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Monthly {metric === "pax" ? "Passengers" : metric === "movements" ? "Movements" : "MTOW"} — {selectedYear}
        </h2>
        <div className="flex items-end gap-2 h-48">
          {MONTHS.map((m, i) => {
            const val = monthlyTotals[i];
            const pct = (val / maxMonthly) * 100;
            return (
              <div key={m} className="flex-1 flex flex-col items-center group relative h-full">
                <div className="w-full flex-1 flex flex-col items-center justify-end overflow-hidden">
                  <span className="text-[9px] text-gray-500 font-mono mb-1 shrink-0">{formatValue(val)}</span>
                  <div
                    className="w-full rounded-t-md bg-blue-500 hover:bg-blue-600 transition-colors duration-300 cursor-pointer animate-[growUp_0.8s_ease-out_forwards]"
                    style={{ height: `${pct}%`, minHeight: 4, animationDelay: `${i * 60}ms`, opacity: 0 }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 shrink-0 mt-1">{m}</span>
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

      {/* Airport breakdown table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Airport × Month Breakdown — {selectedYear}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50/80 z-10">Airport</th>
                {MONTHS.map(m => (
                  <th key={m} className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase">{m}</th>
                ))}
                <th className="text-right px-4 py-2.5 font-semibold text-gray-700 uppercase bg-blue-50/50">Total</th>
              </tr>
            </thead>
            <tbody>
              {airportMonthly.map(apt => (
                <tr key={apt.code} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-gray-900 sticky left-0 bg-white z-10">
                    <p className="font-semibold">{apt.code}</p>
                    <p className="text-[10px] text-gray-400">{apt.name}</p>
                  </td>
                  {apt.months.map((v, i) => (
                    <td key={i} className="text-right px-3 py-2.5 text-gray-600 font-mono">{formatValue(v)}</td>
                  ))}
                  <td className="text-right px-4 py-2.5 font-bold text-gray-900 font-mono bg-blue-50/30">{formatValue(apt.total)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50/80 font-semibold">
                <td className="px-4 py-2.5 text-gray-900 sticky left-0 bg-gray-50/80 z-10">Total</td>
                {monthlyTotals.map((v, i) => (
                  <td key={i} className="text-right px-3 py-2.5 text-gray-900 font-mono">{formatValue(v)}</td>
                ))}
                <td className="text-right px-4 py-2.5 text-gray-900 font-mono bg-blue-50/50">{formatValue(monthlyTotals.reduce((a, b) => a + b, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
