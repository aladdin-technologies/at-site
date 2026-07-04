"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, X, Tag, Gauge, Calculator, Calendar } from "lucide-react";

interface Driver { id: string; name: string; unit: string; description: string | null; }
interface Category { id: string; name: string; }
interface ChargeType {
  id: string; name: string; description: string | null; category_id: string | null;
  unit_rate: number; driver_id: string | null; currency: string; calculation_method: string;
  effective_date: string | null;
}

type Tab = "formulas" | "drivers";

const CURRENCIES = ["USD","EUR","GBP","AED","SGD","INR","JPY","AUD","CAD","CHF","SAR","QAR","BHD","KWD","OMR","MYR","THB","CNY","HKD","KRW","SEK","NOK","DKK","NZD","TRY","ZAR","BRL","MXN"];
const CALC_METHODS = [
  { value: "per_unit", label: "Per Unit", desc: "Rate × Driver volume" },
  { value: "per_tonne", label: "Per Tonne", desc: "Rate × Weight in tonnes" },
  { value: "per_hour", label: "Per Hour", desc: "Rate × Duration in hours" },
  { value: "flat", label: "Flat Fee", desc: "Fixed amount regardless of volume" },
  { value: "tiered", label: "Tiered", desc: "Rate varies by volume band" },
];

export default function ChargesPage() {
  const [tab, setTab] = useState<Tab>("formulas");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [charges, setCharges] = useState<ChargeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [filterCategory, setFilterCategory] = useState("ALL");

  const [newCharge, setNewCharge] = useState({
    name: "", description: "", category_id: "", driver_id: "",
    unit_rate: "", currency: "USD", calculation_method: "per_unit", effective_date: "",
  });
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverUnit, setNewDriverUnit] = useState("units");
  const [newDriverDesc, setNewDriverDesc] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const compRes = await supabase.from("forecast_companies").select("id").limit(1);
    if (compRes.data?.[0]?.id) setCompanyId(compRes.data[0].id);

    const [dRes, catRes, chRes] = await Promise.all([
      supabase.from("forecast_drivers").select("*").order("name"),
      supabase.from("forecast_revenue_categories").select("id, name").order("sort_order"),
      supabase.from("forecast_charge_types").select("*").order("sort_order"),
    ]);
    setDrivers((dRes.data ?? []) as Driver[]);
    setCategories((catRes.data ?? []) as Category[]);
    setCharges((chRes.data ?? []) as ChargeType[]);
    setLoading(false);
  }

  const driverMap = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d])), [drivers]);
  const categoryMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);

  const filteredCharges = useMemo(() => {
    if (filterCategory === "ALL") return charges;
    if (filterCategory === "none") return charges.filter(c => !c.category_id);
    return charges.filter(c => c.category_id === filterCategory);
  }, [charges, filterCategory]);

  async function addCharge() {
    if (!newCharge.name.trim()) return;
    await supabase.from("forecast_charge_types").insert({
      company_id: companyId,
      name: newCharge.name.trim(),
      description: newCharge.description.trim() || null,
      category_id: newCharge.category_id || null,
      driver_id: newCharge.driver_id || null,
      unit_rate: parseFloat(newCharge.unit_rate) || 0,
      currency: newCharge.currency,
      calculation_method: newCharge.calculation_method,
      effective_date: newCharge.effective_date || null,
      sort_order: charges.length,
    });
    setShowAddCharge(false);
    setNewCharge({ name: "", description: "", category_id: "", driver_id: "", unit_rate: "", currency: "USD", calculation_method: "per_unit", effective_date: "" });
    loadAll();
  }

  async function deleteCharge(id: string) {
    await supabase.from("forecast_charge_types").delete().eq("id", id);
    setCharges(prev => prev.filter(c => c.id !== id));
  }

  async function addDriver() {
    if (!newDriverName.trim()) return;
    await supabase.from("forecast_drivers").insert({
      company_id: companyId, name: newDriverName.trim(), unit: newDriverUnit,
      description: newDriverDesc.trim() || null,
    });
    setShowAddDriver(false);
    setNewDriverName(""); setNewDriverUnit("units"); setNewDriverDesc("");
    loadAll();
  }

  async function deleteDriver(id: string) {
    await supabase.from("forecast_drivers").delete().eq("id", id);
    setDrivers(prev => prev.filter(d => d.id !== id));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Charges</h1>
          <p className="text-sm text-gray-500">Define how each revenue line is calculated — charges are formulas</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-6">
        Each charge = Unit Rate × Driver. Example: Landing Charge = 100 AED × Arrival ATM
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button onClick={() => setTab("formulas")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "formulas" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <Calculator size={16} /> Charge Formulas
        </button>
        <button onClick={() => setTab("drivers")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "drivers" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <Gauge size={16} /> Drivers
        </button>
      </div>

      {/* ===== FORMULAS TAB ===== */}
      {tab === "formulas" && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
              <option value="ALL">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="none">Uncategorized</option>
            </select>
            <div className="flex-1" />
            <span className="text-xs text-gray-400 font-mono">{filteredCharges.length} charge{filteredCharges.length !== 1 ? "s" : ""}</span>
            <button onClick={() => setShowAddCharge(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Charge
            </button>
          </div>

          {filteredCharges.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Calculator size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-2">No charges configured yet</p>
              <p className="text-xs text-gray-400 mb-4">Define your first charge formula — connect it to a driver and set the rate</p>
              <button onClick={() => setShowAddCharge(true)} className="text-blue-600 text-sm font-semibold hover:underline">Add your first charge</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCharges.map(ch => {
                const dr = ch.driver_id ? driverMap[ch.driver_id] : null;
                const cat = ch.category_id ? categoryMap[ch.category_id] : null;
                const method = CALC_METHODS.find(m => m.value === ch.calculation_method);

                return (
                  <div key={ch.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-blue-200 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Tag size={18} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm">{ch.name}</h3>
                          {cat && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              cat.name.toLowerCase().includes("non") ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                            }`}>{cat.name}</span>
                          )}
                        </div>
                        {ch.description && <p className="text-xs text-gray-500 mb-2">{ch.description}</p>}

                        {/* Formula display */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {ch.unit_rate > 0 ? (
                            <span className="text-xs font-mono bg-gray-50 border border-gray-100 rounded px-2 py-1 text-gray-800">
                              {ch.currency} {Number(ch.unit_rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No rate set</span>
                          )}
                          {dr && (
                            <>
                              <span className="text-xs text-gray-400">×</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">{dr.name}</span>
                            </>
                          )}
                          {method && (
                            <>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-[10px] text-gray-400">{method.label}</span>
                            </>
                          )}
                          {ch.effective_date && (
                            <>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Calendar size={10} /> {ch.effective_date}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button onClick={() => deleteCharge(ch.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Charge Modal */}
          {showAddCharge && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddCharge(false)}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Add Charge Formula</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Define how this charge is calculated</p>
                  </div>
                  <button onClick={() => setShowAddCharge(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Charge Name *</label>
                      <input value={newCharge.name} onChange={e => setNewCharge(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Domestic Landing" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500" autoFocus />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Revenue Category</label>
                      <select value={newCharge.category_id} onChange={e => setNewCharge(p => ({ ...p, category_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                        <option value="">None</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <input value={newCharge.description} onChange={e => setNewCharge(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Unit Rate</label>
                      <input type="number" step="0.01" value={newCharge.unit_rate} onChange={e => setNewCharge(p => ({ ...p, unit_rate: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                      <select value={newCharge.currency} onChange={e => setNewCharge(p => ({ ...p, currency: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                      <select value={newCharge.calculation_method} onChange={e => setNewCharge(p => ({ ...p, calculation_method: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                        {CALC_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Driver</label>
                      <select value={newCharge.driver_id} onChange={e => setNewCharge(p => ({ ...p, driver_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                        <option value="">Select driver</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.unit})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Effective Date</label>
                      <input type="date" value={newCharge.effective_date} onChange={e => setNewCharge(p => ({ ...p, effective_date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  {/* Formula preview */}
                  {newCharge.unit_rate && newCharge.driver_id && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Formula Preview</p>
                      <p className="font-mono text-sm text-blue-900">
                        <span className="font-bold">{newCharge.name || "Charge"}</span>
                        {" = "}
                        {newCharge.currency} {parseFloat(newCharge.unit_rate || "0").toLocaleString()}
                        {" × "}
                        {driverMap[newCharge.driver_id]?.name || "Driver"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                  <button onClick={() => setShowAddCharge(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={addCharge} disabled={!newCharge.name.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">Create Charge</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== DRIVERS TAB ===== */}
      {tab === "drivers" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{drivers.length} traffic drivers — these are the volume metrics that drive revenue</p>
            <button onClick={() => setShowAddDriver(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Driver
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Driver</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Used By</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => {
                  const usedCount = charges.filter(c => c.driver_id === d.id).length;
                  return (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Gauge size={14} className="text-purple-500" /><span className="font-medium text-gray-900">{d.name}</span></div></td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{d.unit}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{d.description || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500">{usedCount} charge{usedCount !== 1 ? "s" : ""}</td>
                      <td className="px-4 py-3"><button onClick={() => deleteDriver(d.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {showAddDriver && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddDriver(false)}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">Add Driver</h2>
                  <button onClick={() => setShowAddDriver(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Driver Name *</label>
                    <input value={newDriverName} onChange={e => setNewDriverName(e.target.value)} placeholder="e.g. Cargo Tonnes" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                    <select value={newDriverUnit} onChange={e => setNewDriverUnit(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                      <option value="pax">pax</option><option value="movements">movements</option><option value="tonnes">tonnes</option><option value="hours">hours</option><option value="units">units</option><option value="screenings">screenings</option><option value="sqm">sqm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <input value={newDriverDesc} onChange={e => setNewDriverDesc(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                  <button onClick={() => setShowAddDriver(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={addDriver} disabled={!newDriverName.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">Create</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
