"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Upload, CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";

interface CfgAirport { id: string; code: string; name: string; }
interface CfgAirline { id: string; code: string; name: string; applicable_airports: string[] | null; }
interface CfgLine { id: string; name: string; applicable_airports: string[] | null; driver_id: string | null; }
interface CfgDriver { id: string; name: string; unit: string; }

interface DataPoint { year: number; month: number; airport_code: string; airline_code: string; }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export default function HistoricalsPage() {
  const [cfgAirports, setCfgAirports] = useState<CfgAirport[]>([]);
  const [cfgAirlines, setCfgAirlines] = useState<CfgAirline[]>([]);
  const [cfgLines, setCfgLines] = useState<CfgLine[]>([]);
  const [cfgDrivers, setCfgDrivers] = useState<CfgDriver[]>([]);
  const [trafficPoints, setTrafficPoints] = useState<DataPoint[]>([]);
  const [revenuePoints, setRevenuePoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"revenue" | "traffic">("traffic");

  useEffect(() => {
    async function load() {
      const [aRes, alRes, lRes, dRes, tRes, rRes] = await Promise.all([
        supabase.from("forecast_airports").select("id, code, name").order("code"),
        supabase.from("forecast_airlines").select("id, code, name, applicable_airports").order("code"),
        supabase.from("forecast_charge_types").select("id, name, applicable_airports, driver_id").order("sort_order"),
        supabase.from("forecast_drivers").select("id, name, unit").order("name"),
        supabase.from("forecast_traffic").select("year, month, forecast_airlines(code), forecast_airports(code)"),
        supabase.from("forecast_revenue").select("year, month, forecast_airlines(code), forecast_airports(code)").limit(5000),
      ]);
      setCfgAirports((aRes.data ?? []) as CfgAirport[]);
      setCfgAirlines((alRes.data ?? []) as CfgAirline[]);
      setCfgLines((lRes.data ?? []) as CfgLine[]);
      setCfgDrivers((dRes.data ?? []) as CfgDriver[]);

      setTrafficPoints((tRes.data ?? []).map((t: any) => ({
        year: t.year, month: t.month,
        airport_code: t.forecast_airports?.code || "",
        airline_code: t.forecast_airlines?.code || "",
      })));
      setRevenuePoints((rRes.data ?? []).map((r: any) => ({
        year: r.year, month: r.month,
        airport_code: r.forecast_airports?.code || "",
        airline_code: r.forecast_airlines?.code || "",
      })));
      setLoading(false);
    }
    load();
  }, []);

  const activePoints = viewMode === "traffic" ? trafficPoints : revenuePoints;

  const monthCoverage = useMemo(() => {
    if (cfgAirports.length === 0 || cfgAirlines.length === 0) return {};

    const expectedCombos = new Set<string>();
    for (const apt of cfgAirports) {
      for (const al of cfgAirlines) {
        const alApts = al.applicable_airports || [];
        if (alApts.length === 0 || alApts.includes(apt.id)) {
          expectedCombos.add(`${apt.code}:${al.code}`);
        }
      }
    }
    const expectedCount = expectedCombos.size;

    const result: Record<string, "full" | "partial" | "none"> = {};
    for (const year of YEARS) {
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${m}`;
        const matchingPoints = activePoints.filter(p => p.year === year && p.month === m);
        const uniqueCombos = new Set(matchingPoints.map(p => `${p.airport_code}:${p.airline_code}`));

        if (uniqueCombos.size === 0) {
          result[key] = "none";
        } else if (uniqueCombos.size >= expectedCount) {
          result[key] = "full";
        } else {
          result[key] = "partial";
        }
      }
    }
    return result;
  }, [activePoints, cfgAirports, cfgAirlines]);

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

  const totalTraffic = trafficPoints.length;
  const totalRevenue = revenuePoints.length;

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
          <button onClick={() => downloadCSV(generateRevenueTemplate(), "revenue_template.csv")} disabled={cfgAirports.length === 0} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-colors disabled:opacity-40">
            <Download size={16} className="text-blue-500" /> Revenue Template
          </button>
          <button onClick={() => downloadCSV(generateTrafficTemplate(), "traffic_template.csv")} disabled={cfgAirports.length === 0} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-colors disabled:opacity-40">
            <Download size={16} className="text-purple-500" /> Traffic Template
          </button>
          <button className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-blue-200 bg-blue-50 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
            <Upload size={16} className="text-blue-600" /> Upload Revenue Data
          </button>
          <button className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-purple-200 bg-purple-50 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors">
            <Upload size={16} className="text-purple-600" /> Upload Traffic Data
          </button>
        </div>
      </div>

      {/* Data Coverage */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Data Coverage</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {viewMode === "traffic"
                ? (totalTraffic > 0 ? `${totalTraffic} traffic records in database` : "No traffic data uploaded yet")
                : (totalRevenue > 0 ? `${totalRevenue} revenue records in database` : "No revenue data uploaded yet")
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-[10px] mr-2">
              <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Complete</span>
              <span className="flex items-center gap-1"><AlertCircle size={12} className="text-amber-500" /> Partial</span>
              <span className="flex items-center gap-1"><MinusCircle size={12} className="text-gray-300" /> Missing</span>
            </div>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button onClick={() => setViewMode("revenue")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "revenue" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}>Revenue</button>
              <button onClick={() => setViewMode("traffic")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "traffic" ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:bg-gray-50"}`}>Traffic</button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50/80 z-10 w-16">Year</th>
                {MONTHS.map(m => (
                  <th key={m} className="text-center px-2 py-2.5 font-semibold text-gray-500 w-12">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {YEARS.map(year => (
                <tr key={year} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-2.5 sticky left-0 bg-white z-10">
                    <span className="font-bold text-gray-900 font-mono">{year}</span>
                  </td>
                  {MONTHS.map((_, mIdx) => {
                    const status = monthCoverage[`${year}-${mIdx + 1}`] || "none";
                    return (
                      <td key={mIdx} className="px-2 py-2.5 text-center">
                        {status === "full" ? (
                          <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                        ) : status === "partial" ? (
                          <AlertCircle size={16} className="text-amber-500 mx-auto" />
                        ) : (
                          <MinusCircle size={16} className="text-gray-200 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
