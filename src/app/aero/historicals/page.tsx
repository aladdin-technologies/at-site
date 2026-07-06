"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Upload, CheckCircle2, AlertCircle, MinusCircle, Loader2 } from "lucide-react";

interface CfgAirport { id: string; code: string; name: string; }
interface CfgAirline { id: string; code: string; name: string; applicable_airports: string[] | null; }
interface CfgLine { id: string; name: string; applicable_airports: string[] | null; driver_id: string | null; }
interface CfgDriver { id: string; name: string; unit: string; }

interface DataPoint { year: number; month: number; airport_code: string; airline_code: string; }
interface DataValue { airport_code: string; airline_code: string; metric_name: string; year: number; month: number; value: number; }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HistoricalsPage() {
  const [cfgAirports, setCfgAirports] = useState<CfgAirport[]>([]);
  const [cfgAirlines, setCfgAirlines] = useState<CfgAirline[]>([]);
  const [cfgLines, setCfgLines] = useState<CfgLine[]>([]);
  const [cfgDrivers, setCfgDrivers] = useState<CfgDriver[]>([]);
  const [trafficPoints, setTrafficPoints] = useState<DataPoint[]>([]);
  const [revenuePoints, setRevenuePoints] = useState<DataPoint[]>([]);
  const [trafficValues, setTrafficValues] = useState<DataValue[]>([]);
  const [revenueValues, setRevenueValues] = useState<DataValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<"traffic" | "revenue" | null>(null);
  const [uploadResult, setUploadResult] = useState<{ type: string; count: number; error?: string } | null>(null);
  const [viewMode, setViewMode] = useState<"revenue" | "traffic">("traffic");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const revenueFileRef = useRef<HTMLInputElement>(null);
  const trafficFileRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    const compRes = await supabase.from("forecast_companies").select("id").limit(1);
    const cid = compRes.data?.[0]?.id;
    if (cid) setCompanyId(cid);

    const baseHeaders: Record<string, string> = { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` };
    const rpcUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc`;
    const restUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;

    async function fetchAllRows(table: string, filter: string): Promise<any[]> {
      const all: any[] = [];
      let from = 0;
      const batch = 1000;
      while (true) {
        const res = await fetch(`${restUrl}/${table}?${filter}&order=year,month&offset=${from}&limit=${batch}`, { headers: baseHeaders });
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) break;
        all.push(...data);
        if (data.length < batch) break;
        from += batch;
      }
      return all;
    }

    const [aRes, alRes, lRes, dRes, htRes, hrRes, tvRes, rvRes] = await Promise.all([
      supabase.from("forecast_airports").select("id, code, name").order("code"),
      supabase.from("forecast_airlines").select("id, code, name, applicable_airports").order("code"),
      supabase.from("forecast_charge_types").select("id, name, applicable_airports, driver_id").order("sort_order"),
      supabase.from("forecast_drivers").select("id, name, unit").order("name"),
      fetchAllRows("historical_data", "select=airport_code,airline_code,year,month&data_type=eq.traffic").then(data => ({ data })),
      fetchAllRows("historical_data", "select=airport_code,airline_code,year,month&data_type=eq.revenue").then(data => ({ data })),
      fetchAllRows("historical_data", "select=airport_code,airline_code,metric_name,year,month,value&data_type=eq.traffic"),
      fetchAllRows("historical_data", "select=airport_code,airline_code,metric_name,year,month,value&data_type=eq.revenue"),
    ]);
    setCfgAirports((aRes.data ?? []) as CfgAirport[]);
    setCfgAirlines((alRes.data ?? []) as CfgAirline[]);
    setCfgLines((lRes.data ?? []) as CfgLine[]);
    setCfgDrivers((dRes.data ?? []) as CfgDriver[]);

    setTrafficPoints((htRes.data ?? []).map((h: any) => ({ year: h.year, month: h.month, airport_code: h.airport_code, airline_code: h.airline_code })));
    setRevenuePoints((hrRes.data ?? []).map((h: any) => ({ year: h.year, month: h.month, airport_code: h.airport_code, airline_code: h.airline_code })));
    setTrafficValues(Array.isArray(tvRes) ? tvRes : []);
    setRevenueValues(Array.isArray(rvRes) ? rvRes : []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const activePoints = viewMode === "traffic" ? trafficPoints : revenuePoints;

  const dataYears = useMemo(() => {
    const allPoints = [...trafficPoints, ...revenuePoints];
    if (allPoints.length === 0) return [];
    const yrs = [...new Set(allPoints.map(p => p.year))].sort((a, b) => a - b);
    return yrs;
  }, [trafficPoints, revenuePoints]);

  async function clearAllData() {
    if (!confirm("Are you sure you want to delete ALL historical data? This cannot be undone.")) return;
    await supabase.from("historical_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await loadData();
  }

  const expectedCombos = useMemo(() => {
    const combos = new Set<string>();
    for (const apt of cfgAirports) {
      for (const al of cfgAirlines) {
        const alApts = al.applicable_airports || [];
        if (alApts.length === 0 || alApts.includes(apt.id)) {
          combos.add(`${apt.code}:${al.code}`);
        }
      }
    }
    return combos;
  }, [cfgAirports, cfgAirlines]);

  const monthCoverage = useMemo(() => {
    if (expectedCombos.size === 0) return {};

    const result: Record<string, { status: "full" | "partial" | "none"; found: Set<string>; missing: string[] }> = {};
    for (const year of dataYears) {
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${m}`;
        const matchingPoints = activePoints.filter(p => p.year === year && p.month === m);
        const found = new Set(matchingPoints.map(p => `${p.airport_code}:${p.airline_code}`));
        const missing = [...expectedCombos].filter(c => !found.has(c));

        if (found.size === 0) {
          result[key] = { status: "none", found, missing };
        } else if (missing.length === 0) {
          result[key] = { status: "full", found, missing: [] };
        } else {
          result[key] = { status: "partial", found, missing };
        }
      }
    }
    return result;
  }, [activePoints, expectedCombos]);

  function lookupValues(values: DataValue[], apt: string, al: string, metric: string) {
    const byYear: Record<number, number[]> = {};
    for (const v of values) {
      if (v.airport_code === apt && v.airline_code === al && v.metric_name === metric) {
        if (!byYear[v.year]) byYear[v.year] = new Array(12).fill(0);
        byYear[v.year][v.month - 1] = v.value;
      }
    }
    return byYear;
  }

  function generateRevenueTemplate() {
    const header = ["Airport", "Airline", "Revenue Line", "Year", ...MONTHS];
    const rows = [header.join(",")];
    for (const apt of cfgAirports) {
      const airlinesAtApt = cfgAirlines.filter(al => { const a = al.applicable_airports || []; return a.length === 0 || a.includes(apt.id); });
      const linesAtApt = cfgLines.filter(l => { const a = l.applicable_airports || []; return a.length === 0 || a.includes(apt.id); });
      for (const al of airlinesAtApt) {
        for (const line of linesAtApt) {
          const byYear = lookupValues(revenueValues, apt.code, al.code, line.name);
          const years = Object.keys(byYear).map(Number).sort();
          if (years.length > 0) {
            for (const y of years) {
              rows.push([apt.code, al.code, `"${line.name}"`, y, ...byYear[y].map(v => v || "")].join(","));
            }
          } else {
            rows.push([apt.code, al.code, `"${line.name}"`, "", ...MONTHS.map(() => "")].join(","));
          }
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
        const allMetrics = [...kpiLines, ...cfgDrivers.map(d => d.name)];
        for (const metric of allMetrics) {
          const byYear = lookupValues(trafficValues, apt.code, al.code, metric);
          const years = Object.keys(byYear).map(Number).sort();
          if (years.length > 0) {
            for (const y of years) {
              rows.push([apt.code, al.code, `"${metric}"`, y, ...byYear[y].map(v => v || "")].join(","));
            }
          } else {
            rows.push([apt.code, al.code, `"${metric}"`, "", ...MONTHS.map(() => "")].join(","));
          }
        }
      }
    }
    return rows.join("\n");
  }

  async function handleFileUpload(file: File, dataType: "revenue" | "traffic") {
    setUploadingType(dataType);
    setUploadResult(null);
    try {
      const text = await file.text();
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { setUploadResult({ type: dataType, count: 0, error: "File is empty or has no data rows" }); setUploadingType(null); return; }

      const header = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
      const monthIndices: Record<number, number> = {};
      MONTHS.forEach((m, i) => {
        const idx = header.findIndex(h => h.toLowerCase() === m.toLowerCase());
        if (idx >= 0) monthIndices[i + 1] = idx;
      });

      const airportIdx = header.findIndex(h => h.toLowerCase() === "airport");
      const airlineIdx = header.findIndex(h => h.toLowerCase() === "airline");
      const metricIdx = header.findIndex(h => h.toLowerCase() === "metric" || h.toLowerCase() === "revenue line" || h.toLowerCase() === "driver");
      const yearIdx = header.findIndex(h => h.toLowerCase() === "year");

      if (airportIdx < 0 || airlineIdx < 0 || metricIdx < 0) {
        setUploadResult({ type: dataType, count: 0, error: "Missing required columns: Airport, Airline, Metric/Revenue Line" });
        setUploadingType(null); return;
      }

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.replace(/"/g, "").trim());
        const airport = cols[airportIdx];
        const airline = cols[airlineIdx];
        const metric = cols[metricIdx];
        const year = yearIdx >= 0 ? parseInt(cols[yearIdx]) : 0;
        if (!airport || !airline || !metric) continue;

        for (const [month, colIdx] of Object.entries(monthIndices)) {
          const val = parseFloat(cols[Number(colIdx)]);
          if (!isNaN(val) && val !== 0) {
            rows.push({
              company_id: companyId,
              data_type: dataType,
              airport_code: airport,
              airline_code: airline,
              metric_name: metric,
              year: year || 2025,
              month: parseInt(month),
              value: val,
            });
          }
        }
      }

      if (rows.length === 0) {
        setUploadResult({ type: dataType, count: 0, error: "No data values found in the file. Make sure month columns have numbers." });
        setUploadingType(null); return;
      }

      const deleteKeys = new Set(rows.map(r => `${r.airport_code}|${r.airline_code}|${r.metric_name}|${r.year}|${r.month}`));
      const deleteByYearMonth: Record<string, Set<string>> = {};
      for (const key of deleteKeys) {
        const [ac, alc, mn, yr, mo] = key.split("|");
        const ym = `${yr}|${mo}`;
        if (!deleteByYearMonth[ym]) deleteByYearMonth[ym] = new Set();
        deleteByYearMonth[ym].add(`${ac}|${alc}|${mn}`);
      }
      for (const [ym] of Object.entries(deleteByYearMonth)) {
        const [yr, mo] = ym.split("|");
        await supabase.from("historical_data").delete()
          .eq("data_type", dataType).eq("year", parseInt(yr)).eq("month", parseInt(mo));
      }

      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from("historical_data").insert(batch);
        if (error) { setUploadResult({ type: dataType, count: i, error: error.message }); setUploadingType(null); return; }
      }

      setUploadResult({ type: dataType, count: rows.length });
      await loadData();
    } catch (err: any) {
      setUploadResult({ type: dataType, count: 0, error: err.message || "Failed to process file" });
    }
    setUploadingType(null);
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

  const totalTraffic = new Set(trafficPoints.map(p => `${p.airport_code}:${p.airline_code}:${p.year}:${p.month}`)).size;
  const totalRevenue = new Set(revenuePoints.map(p => `${p.airport_code}:${p.airline_code}:${p.year}:${p.month}`)).size;

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
          <button onClick={() => downloadCSV(generateTrafficTemplate(), "traffic_template.csv")} disabled={cfgAirports.length === 0} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-purple-200 transition-colors disabled:opacity-40">
            <Download size={16} className="text-purple-500" /> Traffic Template
          </button>
          <button onClick={() => downloadCSV(generateRevenueTemplate(), "revenue_template.csv")} disabled={cfgAirports.length === 0} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-colors disabled:opacity-40">
            <Download size={16} className="text-blue-500" /> Revenue Template
          </button>
          <button onClick={() => trafficFileRef.current?.click()} disabled={uploadingType !== null} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-purple-200 bg-purple-50 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50">
            {uploadingType === "traffic" ? <Loader2 size={16} className="text-purple-600 animate-spin" /> : <Upload size={16} className="text-purple-600" />}
            Upload Traffic Data
          </button>
          <button onClick={() => revenueFileRef.current?.click()} disabled={uploadingType !== null} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border border-blue-200 bg-blue-50 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50">
            {uploadingType === "revenue" ? <Loader2 size={16} className="text-blue-600 animate-spin" /> : <Upload size={16} className="text-blue-600" />}
            Upload Revenue Data
          </button>
          <input ref={revenueFileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "revenue"); e.target.value = ""; }} />
          <input ref={trafficFileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "traffic"); e.target.value = ""; }} />
        </div>
        {uploadResult && (
          <div className={`mt-3 px-4 py-2.5 rounded-lg text-xs font-medium ${uploadResult.error ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
            {uploadResult.error
              ? `Upload failed: ${uploadResult.error}`
              : `Successfully uploaded ${uploadResult.count.toLocaleString()} ${uploadResult.type} data points`
            }
            <button onClick={() => setUploadResult(null)} className="ml-3 underline">Dismiss</button>
          </div>
        )}
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
              <button onClick={() => setViewMode("traffic")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "traffic" ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:bg-gray-50"}`}>Traffic</button>
              <button onClick={() => setViewMode("revenue")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "revenue" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}>Revenue</button>
            </div>
            {(totalTraffic > 0 || totalRevenue > 0) && (
              <button onClick={clearAllData} className="px-3 py-1.5 text-[10px] font-medium text-red-500 hover:text-red-700 hover:underline transition-colors">Clear All Data</button>
            )}
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
              {dataYears.map(year => (
                <tr key={year} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-2.5 sticky left-0 bg-white z-10">
                    <span className="font-bold text-gray-900 font-mono">{year}</span>
                  </td>
                  {MONTHS.map((m, mIdx) => {
                    const info = monthCoverage[`${year}-${mIdx + 1}`];
                    const status = info?.status || "none";
                    const tooltip = status === "partial"
                      ? `Missing: ${info!.missing.map(c => c.replace(":", " → ")).join(", ")}`
                      : status === "full"
                      ? `${info!.found.size} of ${expectedCombos.size} combos uploaded`
                      : "No data";
                    return (
                      <td key={mIdx} className="px-2 py-2.5 text-center">
                        <span title={`${m} ${year}: ${tooltip}`} className="cursor-default">
                          {status === "full" ? (
                            <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                          ) : status === "partial" ? (
                            <AlertCircle size={16} className="text-amber-500 mx-auto" />
                          ) : (
                            <MinusCircle size={16} className="text-gray-200 mx-auto" />
                          )}
                        </span>
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
