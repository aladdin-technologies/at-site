"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Save, Trash2, Copy, Clock, Check, X, RotateCcw, Eye } from "lucide-react";

interface ForecastVersion {
  id: string; name: string; description: string | null; status: string;
  traffic_data: any[]; yield_config: any; revenue_output: any[];
  manual_overrides: any; settings: any;
  created_at: string; updated_at: string;
}
interface VersionHistory { id: string; version_id: string; snapshot: any; label: string | null; created_at: string; }
interface CfgAirport { id: string; code: string; name: string; }
interface CfgAirline { id: string; code: string; name: string; applicable_airports: string[] | null; }
interface CfgLine { id: string; name: string; driver_id: string | null; }
interface CfgDriver { id: string; name: string; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ScenariosPage() {
  const [versions, setVersions] = useState<ForecastVersion[]>([]);
  const [history, setHistory] = useState<VersionHistory[]>([]);
  const [airports, setAirports] = useState<CfgAirport[]>([]);
  const [airlines, setAirlines] = useState<CfgAirline[]>([]);
  const [lines, setLines] = useState<CfgLine[]>([]);
  const [drivers, setDrivers] = useState<CfgDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showHistory, setShowHistory] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const compRes = await supabase.from("forecast_companies").select("id").limit(1);
    const cid = compRes.data?.[0]?.id;
    if (cid) setCompanyId(cid);

    const [vRes, aRes, alRes, lRes, dRes] = await Promise.all([
      supabase.from("forecast_versions").select("*").order("updated_at", { ascending: false }),
      supabase.from("forecast_airports").select("id, code, name").order("code"),
      supabase.from("forecast_airlines").select("id, code, name, applicable_airports").order("code"),
      supabase.from("forecast_charge_types").select("id, name, driver_id").order("sort_order"),
      supabase.from("forecast_drivers").select("id, name").order("name"),
    ]);
    setVersions((vRes.data ?? []) as ForecastVersion[]);
    setAirports((aRes.data ?? []) as CfgAirport[]);
    setAirlines((alRes.data ?? []) as CfgAirline[]);
    setLines((lRes.data ?? []) as CfgLine[]);
    setDrivers((dRes.data ?? []) as CfgDriver[]);
    setLoading(false);
  }

  const driverMap = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d.name])), [drivers]);

  async function createVersion() {
    if (!newName.trim()) return;
    const defaultYieldConfig: any = {};
    for (const line of lines) {
      defaultYieldConfig[line.id] = {
        method: "historical_avg",
        historicalYears: [2024, 2025],
        excludeMonths: [],
        customValue: null,
        byAirline: false,
      };
    }
    await supabase.from("forecast_versions").insert({
      company_id: companyId,
      name: newName.trim(),
      description: newDesc.trim() || null,
      status: "draft",
      yield_config: defaultYieldConfig,
      settings: { forecastYears: [2026, 2027, 2028] },
    });
    setShowCreate(false); setNewName(""); setNewDesc("");
    const { data } = await supabase.from("forecast_versions").select("id").order("created_at", { ascending: false }).limit(1);
    if (data?.[0]?.id) {
      window.location.href = `/aero/scenarios/${data[0].id}`;
    } else {
      loadAll();
    }
  }

  async function duplicateVersion(v: ForecastVersion) {
    await supabase.from("forecast_versions").insert({
      company_id: companyId,
      name: `${v.name} (Copy)`,
      description: v.description,
      status: "draft",
      traffic_data: v.traffic_data,
      yield_config: v.yield_config,
      revenue_output: v.revenue_output,
      manual_overrides: v.manual_overrides,
      settings: v.settings,
    });
    loadAll();
  }

  async function deleteVersion(id: string) {
    if (!confirm("Delete this forecast scenario? This cannot be undone.")) return;
    await supabase.from("forecast_versions").delete().eq("id", id);
    loadAll();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("forecast_versions").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    loadAll();
  }

  async function saveSnapshot(versionId: string, label?: string) {
    const v = versions.find(x => x.id === versionId);
    if (!v) return;
    await supabase.from("forecast_version_history").insert({
      version_id: versionId,
      snapshot: { traffic_data: v.traffic_data, yield_config: v.yield_config, revenue_output: v.revenue_output, manual_overrides: v.manual_overrides, settings: v.settings },
      label: label || `Snapshot ${new Date().toLocaleString()}`,
    });
  }

  async function loadHistory(versionId: string) {
    const { data } = await supabase.from("forecast_version_history").select("*").eq("version_id", versionId).order("created_at", { ascending: false });
    setHistory((data ?? []) as VersionHistory[]);
    setShowHistory(versionId);
  }

  async function restoreSnapshot(versionId: string, snapshot: any) {
    if (!confirm("Restore this version? Current data will be saved as a snapshot first.")) return;
    await saveSnapshot(versionId, "Auto-save before restore");
    await supabase.from("forecast_versions").update({
      ...snapshot, updated_at: new Date().toISOString(),
    }).eq("id", versionId);
    loadAll();
    setShowHistory(null);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  const STATUS_STYLES: Record<string, string> = {
    draft: "bg-amber-50 text-amber-700",
    published: "bg-emerald-50 text-emerald-700",
    archived: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Scenarios</h1>
          <p className="text-sm text-gray-500">Build, compare, and manage forecast versions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> New Scenario
        </button>
      </div>

      {/* Version list */}
      {versions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500 mb-2">No forecast scenarios yet</p>
          <p className="text-xs text-gray-400 mb-4">Create your first scenario to start building revenue forecasts</p>
          <button onClick={() => setShowCreate(true)} className="text-blue-600 text-sm font-semibold hover:underline">Create scenario</button>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map(v => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-blue-200 transition-colors group cursor-pointer" onClick={() => window.location.href = `/aero/scenarios/${v.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{v.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${STATUS_STYLES[v.status] || STATUS_STYLES.draft}`}>{v.status}</span>
                  </div>
                  {v.description && <p className="text-xs text-gray-500 mb-2">{v.description}</p>}
                  <div className="flex items-center gap-4 text-[10px] text-gray-400">
                    <span>Created {new Date(v.created_at).toLocaleDateString()}</span>
                    <span>Updated {new Date(v.updated_at).toLocaleDateString()}</span>
                    {v.settings?.forecastYears && <span>Years: {v.settings.forecastYears.join(", ")}</span>}
                    <span>{lines.length} revenue lines</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                  <button onClick={() => duplicateVersion(v)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Duplicate">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => loadHistory(v.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Version history">
                    <RotateCcw size={14} />
                  </button>
                  <button onClick={() => saveSnapshot(v.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Save snapshot">
                    <Save size={14} />
                  </button>
                  {v.status === "draft" && (
                    <button onClick={() => updateStatus(v.id, "published")} className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" title="Publish">
                      <Check size={14} />
                    </button>
                  )}
                  {v.status === "published" && (
                    <button onClick={() => updateStatus(v.id, "archived")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-500 transition-colors" title="Archive">
                      <Clock size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteVersion(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">New Forecast Scenario</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Scenario Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Base Case 2026" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500" />
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">What happens next</p>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Upload forecast traffic (future years)</li>
                  <li>Configure yields per revenue line</li>
                  <li>Review auto-calculated revenue</li>
                  <li>Override any numbers manually</li>
                  <li>Save and compare versions</li>
                </ol>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={createVersion} disabled={!newName.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40">Create Scenario</button>
            </div>
          </div>
        </div>
      )}

      {/* Version history modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowHistory(null)}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Version History</h2>
              <button onClick={() => setShowHistory(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No snapshots saved yet</p>
              ) : (
                history.map(h => (
                  <div key={h.id} className="flex items-center justify-between px-6 py-3 border-b border-gray-50 hover:bg-gray-50/50">
                    <div>
                      <p className="text-xs font-medium text-gray-900">{h.label || "Snapshot"}</p>
                      <p className="text-[10px] text-gray-400">{new Date(h.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => restoreSnapshot(showHistory, h.snapshot)} className="text-xs text-blue-600 font-medium hover:underline">Restore</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
