"use client";

import { useEffect, useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Upload, Download, Save, Check, X, Loader2 } from "lucide-react";
import { useAeroCurrencyConverter } from "@/lib/useAeroCurrency";

interface Version { id: string; name: string; description: string | null; status: string; traffic_data: any[]; yield_config: any; revenue_output: any[]; manual_overrides: any; settings: any; updated_at: string; }
interface CfgAirport { id: string; code: string; name: string; }
interface CfgAirline { id: string; code: string; name: string; applicable_airports: string[] | null; }
interface CfgLine { id: string; name: string; driver_id: string | null; }
interface CfgDriver { id: string; name: string; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
type Tab = "traffic" | "yields" | "revenue" | "output";

export default function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { convert } = useAeroCurrencyConverter();
  const [version, setVersion] = useState<Version | null>(null);
  const [airports, setAirports] = useState<CfgAirport[]>([]);
  const [airlines, setAirlines] = useState<CfgAirline[]>([]);
  const [lines, setLines] = useState<CfgLine[]>([]);
  const [drivers, setDrivers] = useState<CfgDriver[]>([]);
  const [historicalRev, setHistoricalRev] = useState<any[]>([]);
  const [historicalTrf, setHistoricalTrf] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("traffic");
  const [uploadingTraffic, setUploadingTraffic] = useState(false);

  const driverMap = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d.name])), [drivers]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const baseHeaders: Record<string, string> = { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` };
    const restUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
    async function fetchAll(filter: string): Promise<any[]> {
      const all: any[] = []; let from = 0;
      while (true) {
        const res = await fetch(`${restUrl}/historical_data?${filter}&order=year,month,airport_code,airline_code,metric_name&offset=${from}&limit=1000`, { headers: baseHeaders });
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) break;
        all.push(...data); if (data.length < 1000) break; from += 1000;
      }
      return all;
    }

    const [vRes, aRes, alRes, lRes, dRes, hRev, hTrf] = await Promise.all([
      supabase.from("forecast_versions").select("*").eq("id", id).single(),
      supabase.from("forecast_airports").select("id, code, name").order("code"),
      supabase.from("forecast_airlines").select("id, code, name, applicable_airports").order("code"),
      supabase.from("forecast_charge_types").select("id, name, driver_id").order("sort_order"),
      supabase.from("forecast_drivers").select("id, name").order("name"),
      fetchAll("select=airport_code,airline_code,metric_name,year,month,value&data_type=eq.revenue"),
      fetchAll("select=airport_code,airline_code,metric_name,year,month,value&data_type=eq.traffic"),
    ]);
    if (vRes.data) setVersion(vRes.data as Version);
    setAirports((aRes.data ?? []) as CfgAirport[]);
    setAirlines((alRes.data ?? []) as CfgAirline[]);
    setLines((lRes.data ?? []) as CfgLine[]);
    setDrivers((dRes.data ?? []) as CfgDriver[]);
    setHistoricalRev(hRev);
    setHistoricalTrf(hTrf);
    setLoading(false);
  }

  async function saveVersion(updates: Partial<Version>) {
    setSaving(true);
    await supabase.from("forecast_versions").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    await loadAll();
    setSaving(false);
  }

  const forecastYears = version?.settings?.forecastYears || [2026, 2027, 2028];
  const historicalYears = useMemo(() => [...new Set(historicalRev.map(d => d.year))].sort(), [historicalRev]);
  const allYears = useMemo(() => [...new Set([...historicalYears, ...forecastYears])].sort(), [historicalYears, forecastYears]);

  function getHistoricalYield(lineName: string, driverName: string, config: any): number {
    const years = config?.historicalYears || [2024, 2025];
    const exclude = new Set(config?.excludeMonths || []);
    let totalRev = 0, totalDriver = 0;
    for (const d of historicalRev) {
      if (d.metric_name === lineName && years.includes(d.year) && !exclude.has(`${d.year}-${d.month}`)) {
        totalRev += Number(d.value);
      }
    }
    for (const d of historicalTrf) {
      if (d.metric_name === driverName && years.includes(d.year) && !exclude.has(`${d.year}-${d.month}`)) {
        totalDriver += Number(d.value);
      }
    }
    return totalDriver > 0 ? totalRev / totalDriver : 0;
  }

  async function handleTrafficUpload(file: File) {
    setUploadingTraffic(true);
    try {
      const text = await file.text();
      const csvLines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (csvLines.length < 2) { setUploadingTraffic(false); return; }
      const header = csvLines[0].split(",").map(h => h.replace(/"/g, "").trim());
      const monthIndices: Record<number, number> = {};
      MONTHS.forEach((m, i) => { const idx = header.findIndex(h => h.toLowerCase() === m.toLowerCase()); if (idx >= 0) monthIndices[i + 1] = idx; });
      const airportIdx = header.findIndex(h => h.toLowerCase() === "airport");
      const airlineIdx = header.findIndex(h => h.toLowerCase() === "airline");
      const metricIdx = header.findIndex(h => h.toLowerCase().includes("metric") || h.toLowerCase().includes("driver"));
      const yearIdx = header.findIndex(h => h.toLowerCase() === "year");

      const rows: any[] = [];
      for (let i = 1; i < csvLines.length; i++) {
        const cols = csvLines[i].split(",").map(c => c.replace(/"/g, "").trim());
        const airport = cols[airportIdx]; const airline = cols[airlineIdx]; const metric = cols[metricIdx]; const year = yearIdx >= 0 ? parseInt(cols[yearIdx]) : 0;
        if (!airport || !airline || !metric) continue;
        for (const [month, colIdx] of Object.entries(monthIndices)) {
          const val = parseFloat(cols[Number(colIdx)]);
          if (!isNaN(val) && val !== 0) rows.push({ airport_code: airport, airline_code: airline, metric_name: metric, year: year || 2026, month: parseInt(month), value: val });
        }
      }
      await saveVersion({ traffic_data: rows });
    } catch {}
    setUploadingTraffic(false);
  }

  if (loading || !version) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  const yieldConfig = version.yield_config || {};

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 z-10 py-3 -mx-6 px-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/aero/scenarios")} className="text-gray-400 hover:text-gray-900 transition-colors"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{version.name}</h1>
            <p className="text-xs text-gray-500">{version.description || "Forecast scenario"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => saveVersion({})} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {([
          { key: "traffic" as Tab, label: "1. Traffic" },
          { key: "yields" as Tab, label: "2. Yields" },
          { key: "revenue" as Tab, label: "3. Revenue" },
          { key: "output" as Tab, label: "4. Output" },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t.label}</button>
        ))}
      </div>

      {/* ===== 1. TRAFFIC ===== */}
      {tab === "traffic" && (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Upload Forecast Traffic</h2>
            <p className="text-xs text-gray-500 mb-4">Upload traffic volumes for future years ({forecastYears.join(", ")}). Use the same template format from Historicals.</p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-purple-200 bg-purple-50 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer">
                {uploadingTraffic ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload Traffic CSV
                <input type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleTrafficUpload(f); e.target.value = ""; }} />
              </label>
              <span className="text-[10px] text-gray-400">{(version.traffic_data || []).length} traffic data points loaded</span>
            </div>
          </div>

          {(version.traffic_data || []).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Traffic Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase">Year</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500 uppercase">Data Points</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500 uppercase">Airports</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500 uppercase">Airlines</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...new Set((version.traffic_data || []).map((d: any) => d.year))].sort().map((yr: any) => {
                      const yearData = (version.traffic_data || []).filter((d: any) => d.year === yr);
                      return (
                        <tr key={yr} className="border-b border-gray-50">
                          <td className="px-3 py-2 font-bold text-gray-900 font-mono">{yr}</td>
                          <td className="px-3 py-2 text-right font-mono text-gray-600">{yearData.length}</td>
                          <td className="px-3 py-2 text-right font-mono text-gray-600">{new Set(yearData.map((d: any) => d.airport_code)).size}</td>
                          <td className="px-3 py-2 text-right font-mono text-gray-600">{new Set(yearData.map((d: any) => d.airline_code)).size}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 2. YIELDS ===== */}
      {tab === "yields" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 mb-2">Configure how yield is calculated for each revenue line. Historical yield = weighted average of selected years.</p>
          {lines.map(line => {
            const driverName = line.driver_id ? driverMap[line.driver_id] : "Total Passengers";
            const config = yieldConfig[line.id] || { method: "historical_avg", historicalYears: [2024, 2025], excludeMonths: [], customValue: null };
            const histYield = getHistoricalYield(line.name, driverName, config);

            return (
              <div key={line.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{line.name}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">{driverName}</span>
                  </div>
                  <span className="text-xs font-mono text-gray-900 font-bold">Yield: {histYield.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Method</label>
                    <select
                      value={config.method}
                      onChange={e => {
                        const newConfig = { ...yieldConfig, [line.id]: { ...config, method: e.target.value } };
                        saveVersion({ yield_config: newConfig });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none"
                    >
                      <option value="historical_avg">Historical Average</option>
                      <option value="custom">Custom Value</option>
                    </select>
                  </div>

                  {config.method === "historical_avg" && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">Historical Years</label>
                      <div className="flex gap-1 flex-wrap">
                        {historicalYears.map(yr => {
                          const selected = (config.historicalYears || []).includes(yr);
                          return (
                            <button key={yr} onClick={() => {
                              const newYears = selected ? config.historicalYears.filter((y: number) => y !== yr) : [...(config.historicalYears || []), yr];
                              saveVersion({ yield_config: { ...yieldConfig, [line.id]: { ...config, historicalYears: newYears } } });
                            }} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${selected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>{yr}</button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {config.method === "custom" && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">Custom Yield Value</label>
                      <input
                        type="number" step="0.01"
                        value={config.customValue || ""}
                        onChange={e => saveVersion({ yield_config: { ...yieldConfig, [line.id]: { ...config, customValue: parseFloat(e.target.value) || null } } })}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 font-mono outline-none"
                        placeholder="Enter yield"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Formula</label>
                    <p className="text-[10px] text-gray-400 font-mono bg-gray-50 rounded px-2 py-1.5">
                      {line.name} Revenue = {config.method === "custom" ? (config.customValue || "?") : histYield.toFixed(2)} × {driverName}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== 3. REVENUE ===== */}
      {tab === "revenue" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500">Auto-calculated: Revenue = Traffic × Yield. Click any number to override manually.</p>
            <button onClick={() => {
              const output: any[] = [];
              for (const line of lines) {
                const driverName = line.driver_id ? driverMap[line.driver_id] : "Total Passengers";
                const config = yieldConfig[line.id] || { method: "historical_avg", historicalYears: [2024, 2025] };
                const yieldVal = config.method === "custom" && config.customValue ? config.customValue : getHistoricalYield(line.name, driverName, config);

                for (const yr of forecastYears) {
                  for (let m = 1; m <= 12; m++) {
                    const hasHistory = historicalRev.some(d => d.year === yr && d.month === m && d.metric_name === line.name);
                    if (hasHistory) {
                      const histVal = historicalRev.filter(d => d.year === yr && d.month === m && d.metric_name === line.name).reduce((s, d) => s + Number(d.value), 0);
                      output.push({ line: line.name, year: yr, month: m, value: histVal, source: "actual" });
                    } else {
                      const traffic = (version.traffic_data || []).filter((d: any) => d.year === yr && d.month === m && d.metric_name === driverName).reduce((s: number, d: any) => s + Number(d.value), 0);
                      const overrideKey = `${line.name}:${yr}:${m}`;
                      const override = (version.manual_overrides || {})[overrideKey];
                      output.push({ line: line.name, year: yr, month: m, value: override ?? traffic * yieldVal, source: override !== undefined ? "manual" : "calculated" });
                    }
                  }
                }
              }
              saveVersion({ revenue_output: output });
            }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700">
              <Check size={14} /> Calculate Revenue
            </button>
          </div>

          {(version.revenue_output || []).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-sm text-gray-500">Click "Calculate Revenue" to generate forecast</p>
              <p className="text-xs text-gray-400 mt-1">Make sure traffic is uploaded and yields are configured first</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lines.map(line => {
                const lineOutput = (version.revenue_output || []).filter((d: any) => d.line === line.name);
                return (
                  <div key={line.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{line.name}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50/80 border-b border-gray-100">
                            <th className="text-left px-2 py-2 font-semibold text-gray-500">Year</th>
                            {MONTHS.map(m => <th key={m} className="text-right px-2 py-2 font-semibold text-gray-500">{m}</th>)}
                            <th className="text-right px-2 py-2 font-bold text-gray-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forecastYears.map(yr => {
                            const yearData = lineOutput.filter((d: any) => d.year === yr);
                            const total = yearData.reduce((s: number, d: any) => s + Number(d.value), 0);
                            return (
                              <tr key={yr} className="border-b border-gray-50">
                                <td className="px-2 py-2 font-bold text-gray-900 font-mono">{yr}</td>
                                {MONTHS.map((_, mi) => {
                                  const d = yearData.find((x: any) => x.month === mi + 1);
                                  const val = d ? Number(d.value) : 0;
                                  const source = d?.source || "none";
                                  return (
                                    <td key={mi} className={`px-2 py-2 text-right font-mono cursor-pointer hover:bg-blue-50 transition-colors ${source === "actual" ? "text-emerald-700 bg-emerald-50/30" : source === "manual" ? "text-amber-700 bg-amber-50/30" : "text-gray-700"}`} title={source === "actual" ? "Actual (from history)" : source === "manual" ? "Manual override" : "Calculated"}>
                                      {val > 0 ? `${Math.round(convert(val, "USD") / 1000000)}m` : "—"}
                                    </td>
                                  );
                                })}
                                <td className="px-2 py-2 text-right font-mono font-bold text-gray-900 bg-blue-50/30">{Math.round(convert(total, "USD") / 1000000).toLocaleString()}m</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[9px]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-200" /> Actual</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-200" /> Manual</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-gray-100" /> Calculated</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== 4. OUTPUT ===== */}
      {tab === "output" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500">Forecast output — download or review</p>
            <button onClick={() => {
              const header = ["Airport", "Airline", "Revenue Line", "Year", ...MONTHS];
              const rows = [header.join(",")];
              for (const d of (version.revenue_output || [])) {
                const existing = rows.find(r => r.startsWith(`ALL,ALL,"${d.line}",${d.year}`));
                if (!existing) {
                  const monthVals = MONTHS.map((_, mi) => {
                    const val = (version.revenue_output || []).find((x: any) => x.line === d.line && x.year === d.year && x.month === mi + 1);
                    return val ? Math.round(Number(val.value)) : "";
                  });
                  rows.push(`ALL,ALL,"${d.line}",${d.year},${monthVals.join(",")}`);
                }
              }
              const blob = new Blob([rows.join("\n")], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `forecast_${version.name.replace(/\s+/g, "_")}.csv`; a.click();
              URL.revokeObjectURL(url);
            }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50">
              <Download size={14} /> Download Forecast
            </button>
          </div>

          {(version.revenue_output || []).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-sm text-gray-500">No forecast output yet</p>
              <p className="text-xs text-gray-400 mt-1">Go to the Revenue tab and click "Calculate Revenue" first</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Forecast Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase">Revenue Line</th>
                      {forecastYears.map(yr => <th key={yr} className="text-right px-3 py-2 font-semibold text-gray-500">{yr}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map(line => (
                      <tr key={line.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 font-medium text-gray-900">{line.name}</td>
                        {forecastYears.map(yr => {
                          const total = (version.revenue_output || []).filter((d: any) => d.line === line.name && d.year === yr).reduce((s: number, d: any) => s + Number(d.value), 0);
                          return <td key={yr} className="px-3 py-2.5 text-right font-mono text-gray-700">{Math.round(convert(total, "USD") / 1000000).toLocaleString()}m</td>;
                        })}
                      </tr>
                    ))}
                    <tr className="bg-blue-50/50 border-t-2 border-blue-200">
                      <td className="px-3 py-2.5 font-bold text-gray-900">Total Revenue</td>
                      {forecastYears.map(yr => {
                        const total = (version.revenue_output || []).filter((d: any) => d.year === yr).reduce((s: number, d: any) => s + Number(d.value), 0);
                        return <td key={yr} className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">{Math.round(convert(total, "USD") / 1000000).toLocaleString()}m</td>;
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
