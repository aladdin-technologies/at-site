"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Upload, CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";

interface CfgAirport { id: string; code: string; name: string; }
interface CfgAirline { id: string; code: string; name: string; applicable_airports: string[] | null; }
interface CfgLine { id: string; name: string; applicable_airports: string[] | null; driver_id: string | null; }
interface CfgDriver { id: string; name: string; unit: string; }

interface TrafficRow {
  year: number; month: number;
  forecast_airlines: { code: string } | null;
  forecast_airports: { code: string } | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HistoricalsPage() {
  const [cfgAirports, setCfgAirports] = useState<CfgAirport[]>([]);
  const [cfgAirlines, setCfgAirlines] = useState<CfgAirline[]>([]);
  const [cfgLines, setCfgLines] = useState<CfgLine[]>([]);
  const [cfgDrivers, setCfgDrivers] = useState<CfgDriver[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"revenue" | "traffic">("revenue");

  useEffect(() => {
    async function load() {
      const [aRes, alRes, lRes, dRes, tRes] = await Promise.all([
        supabase.from("forecast_airports").select("id, code, name").order("code"),
        supabase.from("forecast_airlines").select("id, code, name, applicable_airports").order("code"),
        supabase.from("forecast_charge_types").select("id, name, applicable_airports, driver_id").order("sort_order"),
        supabase.from("forecast_drivers").select("id, name, unit").order("name"),
        supabase.from("forecast_traffic").select("year, month, forecast_airlines(code), forecast_airports(code)"),
      ]);
      setCfgAirports((aRes.data ?? []) as CfgAirport[]);
      setCfgAirlines((alRes.data ?? []) as CfgAirline[]);
      setCfgLines((lRes.data ?? []) as CfgLine[]);
      setCfgDrivers((dRes.data ?? []) as CfgDriver[]);
      setTrafficData((tRes.data ?? []) as unknown as TrafficRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const dataYears = useMemo(() => {
    const yrs = new Set(trafficData.map(t => t.year));
    if (yrs.size === 0) return [2023, 2024, 2025];
    const min = Math.min(...yrs);
    const max = Math.max(...yrs);
    const result: number[] = [];
    for (let y = min; y <= max; y++) result.push(y);
    return result;
  }, [trafficData]);

  const coverageMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const t of trafficData) {
      const aptCode = (t.forecast_airports as any)?.code;
      const alCode = (t.forecast_airlines as any)?.code;
      if (!aptCode) continue;
      const key = `${aptCode}:${alCode || "ALL"}`;
      if (!map[key]) map[key] = new Set();
      map[key].add(`${t.year}-${t.month}`);
    }
    return map;
  }, [trafficData]);

  function getCoverage(aptCode: string, alCode: string, year: number): "full" | "partial" | "none" {
    const key = `${aptCode}:${alCode}`;
    const data = coverageMap[key];
    if (!data) return "none";
    let count = 0;
    for (let m = 1; m <= 12; m++) {
      if (data.has(`${year}-${m}`)) count++;
    }
    if (count === 12) return "full";
    if (count > 0) return "partial";
    return "none";
  }

  function generateRevenueTemplate() {
    const header = ["Airport", "Airline", "Revenue Line", "Year", ...MONTHS];
    const rows = [header.join(",")];
    for (const apt of cfgAirports) {
      const airlinesAtApt = cfgAirlines.filter(al => { const a = al.applicable_airports || []; return a.length === 0 || a.includes(apt.id); });
      const linesAtApt = cfgLines.filter(l => { const a = l.applicable_airports || []; return a.length === 0 || a.includes(apt.id); });
      for (const al of airlinesAtApt) {
        for (const line of linesAtApt) {
          rows.push([apt.code, al.code, `"${line.name}"`, "", ...MONTHS.map(() => "")].join(","));
        }
      }
    }
    return rows.join("\n");
  }

  function generateTrafficTemplate() {
    const header = ["Airport", "Airline", "Metric", "Year", ...MONTHS];
    const rows = [header.join(",")];
    const kpiLines = ["Total Passengers", "Total Movements"];
    for (const apt of cfgAirports) {
      const airlinesAtApt = cfgAirlines.filter(al => { const a = al.applicable_airports || []; return a.length === 0 || a.includes(apt.id); });
      for (const al of airlinesAtApt) {
        for (const kpi of kpiLines) {
          rows.push([apt.code, al.code, kpi, "", ...MONTHS.map(() => "")].join(","));
        }
        for (const dr of cfgDrivers) {
          rows.push([apt.code, al.code, `"${dr.name}"`, "", ...MONTHS.map(() => "")].join(","));
        }
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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const totalExpected = cfgAirports.length * cfgAirlines.length * dataYears.length * 12;
  const totalUploaded = Object.values(coverageMap).reduce((s, set) => s + set.size, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Historical Data</h1>
          <p className="text-sm text-gray-500">Manage uploaded data — download templates, upload, and track coverage</p>
        </div>
      </div>

      {/* Templates & Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Templates & Upload</h2>
        <p className="text-xs text-gray-500 mb-4">Download pre-filled templates based on your revenue structure, or upload completed data</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => downloadCSV(generateRevenueTemplate(), "revenue_template.csv")}
            disabled={cfgAirports.length === 0}
            className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-colors disabled:opacity-40"
          >
            <Download size={16} className="text-blue-500" />
            Revenue Template
          </button>
          <button
            onClick={() => downloadCSV(generateTrafficTemplate(), "traffic_template.csv")}
            disabled={cfgAirports.length === 0}
            className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-colors disabled:opacity-40"
          >
            <Download size={16} className="text-purple-500" />
            Traffic Template
          </button>
          <button className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-blue-200 bg-blue-50 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
            <Upload size={16} className="text-blue-600" />
            Upload Revenue Data
          </button>
          <button className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-purple-200 bg-purple-50 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors">
            <Upload size={16} className="text-purple-600" />
            Upload Traffic Data
          </button>
        </div>
      </div>

      {/* Data Coverage */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Data Coverage</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalUploaded > 0
                ? `${totalUploaded.toLocaleString()} data points uploaded across ${dataYears.length} year${dataYears.length !== 1 ? "s" : ""}`
                : "No data uploaded yet — download a template and upload your historical data"
              }
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Complete</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400" /> Partial</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" /> Missing</span>
            </div>
          </div>
        </div>

        {/* Heatmap by Airport × Airline × Year */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50/80 z-10">Airport</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase">Airline</th>
                {dataYears.map(y => (
                  <th key={y} className="text-center px-3 py-2.5 font-semibold text-gray-500">{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cfgAirports.map(apt => {
                const airlinesAtApt = cfgAirlines.filter(al => {
                  const a = al.applicable_airports || [];
                  return a.length === 0 || a.includes(apt.id);
                });

                return airlinesAtApt.map((al, alIdx) => (
                  <tr key={`${apt.id}-${al.id}`} className={`border-b border-gray-50 hover:bg-gray-50/30 transition-colors ${alIdx === 0 ? "border-t border-gray-100" : ""}`}>
                    <td className="px-4 py-2 sticky left-0 bg-white z-10">
                      {alIdx === 0 && (
                        <div>
                          <span className="font-bold text-gray-900 font-mono">{apt.code}</span>
                          <span className="text-gray-400 ml-1.5 hidden sm:inline">{apt.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">{al.code}</span>
                    </td>
                    {dataYears.map(year => {
                      const status = getCoverage(apt.code, al.code, year);
                      return (
                        <td key={year} className="px-3 py-2 text-center">
                          {status === "full" ? (
                            <span className="inline-flex w-6 h-6 rounded bg-emerald-50 items-center justify-center" title="12/12 months">
                              <CheckCircle2 size={14} className="text-emerald-500" />
                            </span>
                          ) : status === "partial" ? (
                            <span className="inline-flex w-6 h-6 rounded bg-amber-50 items-center justify-center" title="Partial data">
                              <AlertCircle size={14} className="text-amber-500" />
                            </span>
                          ) : (
                            <span className="inline-flex w-6 h-6 rounded bg-gray-50 items-center justify-center" title="No data">
                              <MinusCircle size={14} className="text-gray-300" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>

        {cfgAirports.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 mb-1">No airports configured</p>
            <p className="text-xs text-gray-400">Set up your airports in Revenue Lines first, then upload historical data here</p>
          </div>
        )}
      </div>
    </div>
  );
}
