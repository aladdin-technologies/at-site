"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Download, Upload } from "lucide-react";

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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HistoricalsPage() {
  const [traffic, setTraffic] = useState<TrafficRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [metric, setMetric] = useState<"pax" | "movements" | "mtow">("pax");

  useEffect(() => {
    async function load() {
      const res = await supabase.from("forecast_traffic").select("*, forecast_airlines(code, name), forecast_airports(code, name)");
      setTraffic((res.data ?? []) as unknown as TrafficRow[]);
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

      {/* Template actions */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => {
            const header = ["Year","Month","Airport","Airline","Arriving Pax","Departing Pax","Transfer Pax","Transit Pax","Total Movements","MTOW (tonnes)"];
            const rows = [header.join(",")];
            for (const y of years) {
              for (let m = 1; m <= 12; m++) {
                for (const apt of airports) {
                  rows.push([y, m, apt.code, "", "", "", "", "", "", ""].join(","));
                }
              }
            }
            const blob = new Blob([rows.join("\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "traffic_template.csv"; a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download size={14} /> Download Driver Template
        </button>
        <button
          onClick={() => {
            const header = ["Year","Month","Airport","Revenue Line","Revenue Amount","Currency"];
            const rows = [header.join(",")];
            const blob = new Blob([rows.join("\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "revenue_template.csv"; a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download size={14} /> Download Revenue Template
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <Upload size={14} /> Upload Data
        </button>
        <span className="text-[10px] text-gray-400 ml-2">Templates are generated based on your configured revenue structure</span>
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
              <div key={m} className="flex-1 flex flex-col items-center gap-1 group relative h-full">
                <span className="text-[9px] text-gray-400 font-mono shrink-0">{formatValue(val)}</span>
                <div className="w-full flex-1 flex items-end overflow-hidden">
                  <div
                    className="w-full rounded-t-md bg-blue-500 hover:bg-blue-600 transition-colors duration-300 cursor-pointer animate-[growUp_0.8s_ease-out_forwards]"
                    style={{ height: `${pct}%`, minHeight: 4, animationDelay: `${i * 60}ms`, opacity: 0 }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 shrink-0">{m}</span>
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
