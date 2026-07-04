"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Trash2, X, ChevronDown, ChevronRight,
  Building2, Tag, Gauge, Plane, Save, Search,
} from "lucide-react";

interface Driver {
  id: string;
  name: string;
  unit: string;
  description: string | null;
}

interface ChargeType {
  id: string;
  name: string;
  description: string | null;
}

interface Airport {
  id: string;
  code: string;
  name: string;
}

interface Airline {
  id: string;
  code: string;
  name: string;
}

interface ChargeRate {
  id: string;
  airport_id: string;
  airline_id: string | null;
  charge_type_id: string;
  driver_id: string;
  yield_rate: number;
  currency: string;
  notes: string | null;
}

type Tab = "rates" | "charges" | "drivers";

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "SGD", "INR", "JPY", "AUD", "CAD", "CHF", "SAR", "QAR", "BHD", "KWD", "OMR", "MYR", "THB", "CNY", "HKD", "KRW"];

export default function ChargesBuilderPage() {
  const [tab, setTab] = useState<Tab>("rates");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [rates, setRates] = useState<ChargeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Modals
  const [showAddRate, setShowAddRate] = useState(false);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);

  // Filters
  const [filterAirport, setFilterAirport] = useState("ALL");
  const [filterCharge, setFilterCharge] = useState("ALL");
  const [filterSearch, setFilterSearch] = useState("");

  // New rate form
  const [newRate, setNewRate] = useState({
    airport_id: "", airline_id: "", charge_type_id: "", driver_id: "",
    yield_rate: "", currency: "USD", notes: "",
  });

  // New charge type form
  const [newChargeName, setNewChargeName] = useState("");
  const [newChargeDesc, setNewChargeDesc] = useState("");

  // New driver form
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverUnit, setNewDriverUnit] = useState("units");
  const [newDriverDesc, setNewDriverDesc] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const compRes = await supabase.from("forecast_companies").select("id").limit(1);
    const cid = compRes.data?.[0]?.id;
    if (cid) setCompanyId(cid);

    const [dRes, ctRes, aRes, alRes, rRes] = await Promise.all([
      supabase.from("forecast_drivers").select("*").order("name"),
      supabase.from("forecast_charge_types").select("*").order("name"),
      supabase.from("forecast_airports").select("id, code, name").order("code"),
      supabase.from("forecast_airlines").select("id, code, name").order("code"),
      supabase.from("forecast_charge_rates").select("*").order("created_at", { ascending: false }),
    ]);
    setDrivers((dRes.data ?? []) as Driver[]);
    setChargeTypes((ctRes.data ?? []) as ChargeType[]);
    setAirports((aRes.data ?? []) as Airport[]);
    setAirlines((alRes.data ?? []) as Airline[]);
    setRates((rRes.data ?? []) as ChargeRate[]);
    setLoading(false);
  }

  // Lookups
  const driverMap = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d])), [drivers]);
  const chargeMap = useMemo(() => Object.fromEntries(chargeTypes.map(c => [c.id, c])), [chargeTypes]);
  const airportMap = useMemo(() => Object.fromEntries(airports.map(a => [a.id, a])), [airports]);
  const airlineMap = useMemo(() => Object.fromEntries(airlines.map(a => [a.id, a])), [airlines]);

  const filteredRates = useMemo(() => {
    return rates.filter(r => {
      if (filterAirport !== "ALL" && r.airport_id !== filterAirport) return false;
      if (filterCharge !== "ALL" && r.charge_type_id !== filterCharge) return false;
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        const apt = airportMap[r.airport_id];
        const al = r.airline_id ? airlineMap[r.airline_id] : null;
        const ct = chargeMap[r.charge_type_id];
        const dr = driverMap[r.driver_id];
        const searchStr = [apt?.code, apt?.name, al?.code, al?.name, ct?.name, dr?.name, r.currency].filter(Boolean).join(" ").toLowerCase();
        if (!searchStr.includes(q)) return false;
      }
      return true;
    });
  }, [rates, filterAirport, filterCharge, filterSearch, airportMap, airlineMap, chargeMap, driverMap]);

  // CRUD
  async function addRate() {
    if (!newRate.airport_id || !newRate.charge_type_id || !newRate.driver_id || !newRate.yield_rate) return;
    await supabase.from("forecast_charge_rates").insert({
      company_id: companyId,
      airport_id: newRate.airport_id,
      airline_id: newRate.airline_id || null,
      charge_type_id: newRate.charge_type_id,
      driver_id: newRate.driver_id,
      yield_rate: parseFloat(newRate.yield_rate),
      currency: newRate.currency,
      notes: newRate.notes || null,
    });
    setShowAddRate(false);
    setNewRate({ airport_id: "", airline_id: "", charge_type_id: "", driver_id: "", yield_rate: "", currency: "USD", notes: "" });
    loadAll();
  }

  async function deleteRate(id: string) {
    await supabase.from("forecast_charge_rates").delete().eq("id", id);
    setRates(prev => prev.filter(r => r.id !== id));
  }

  async function addChargeType() {
    if (!newChargeName.trim()) return;
    await supabase.from("forecast_charge_types").insert({
      company_id: companyId, name: newChargeName.trim(), description: newChargeDesc.trim() || null,
    });
    setShowAddCharge(false);
    setNewChargeName("");
    setNewChargeDesc("");
    loadAll();
  }

  async function deleteChargeType(id: string) {
    await supabase.from("forecast_charge_types").delete().eq("id", id);
    setChargeTypes(prev => prev.filter(c => c.id !== id));
  }

  async function addDriver() {
    if (!newDriverName.trim()) return;
    await supabase.from("forecast_drivers").insert({
      company_id: companyId, name: newDriverName.trim(), unit: newDriverUnit, description: newDriverDesc.trim() || null,
    });
    setShowAddDriver(false);
    setNewDriverName("");
    setNewDriverUnit("units");
    setNewDriverDesc("");
    loadAll();
  }

  async function deleteDriver(id: string) {
    await supabase.from("forecast_drivers").delete().eq("id", id);
    setDrivers(prev => prev.filter(d => d.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Charge Builder</h1>
          <p className="text-sm text-gray-500">Configure airport charges, drivers, and rates</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">{rates.length} rates</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-400 font-mono">{chargeTypes.length} charges</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-400 font-mono">{drivers.length} drivers</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {([
          { key: "rates" as Tab, label: "Charge Rates", icon: Tag },
          { key: "charges" as Tab, label: "Charge Types", icon: Building2 },
          { key: "drivers" as Tab, label: "Drivers", icon: Gauge },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* ===== CHARGE RATES TAB ===== */}
      {tab === "rates" && (
        <div>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                placeholder="Search rates..."
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <select value={filterAirport} onChange={e => setFilterAirport(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
              <option value="ALL">All Airports</option>
              {airports.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
            <select value={filterCharge} onChange={e => setFilterCharge(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
              <option value="ALL">All Charges</option>
              {chargeTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              onClick={() => setShowAddRate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
            >
              <Plus size={16} /> Add Rate
            </button>
          </div>

          {/* Rates table */}
          {filteredRates.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Tag size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-2">No charge rates configured yet</p>
              <button onClick={() => setShowAddRate(true)} className="text-blue-600 text-sm font-semibold hover:underline">
                Add your first charge rate
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Airport</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Airline</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Charge</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Driver</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Formula</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRates.map(r => {
                      const apt = airportMap[r.airport_id];
                      const al = r.airline_id ? airlineMap[r.airline_id] : null;
                      const ct = chargeMap[r.charge_type_id];
                      const dr = driverMap[r.driver_id];
                      return (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{apt?.code || "—"}</p>
                            <p className="text-[10px] text-gray-400">{apt?.name}</p>
                          </td>
                          <td className="px-4 py-3">
                            {al ? (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{al.code}</span>
                            ) : (
                              <span className="text-xs text-gray-400">All Airlines</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-700">{ct?.name || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">{dr?.name || "—"}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                            {r.currency} {Number(r.yield_rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {r.currency} {Number(r.yield_rate).toFixed(0)} × {dr?.name || "driver"} = Revenue
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => deleteRate(r.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Rate Modal */}
          {showAddRate && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddRate(false)}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">Add Charge Rate</h2>
                  <button onClick={() => setShowAddRate(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Airport *</label>
                      <select value={newRate.airport_id} onChange={e => setNewRate(p => ({ ...p, airport_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                        <option value="">Select airport</option>
                        {airports.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Airline <span className="text-gray-400">(optional)</span></label>
                      <select value={newRate.airline_id} onChange={e => setNewRate(p => ({ ...p, airline_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                        <option value="">All Airlines</option>
                        {airlines.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Charge Type *</label>
                      <select value={newRate.charge_type_id} onChange={e => setNewRate(p => ({ ...p, charge_type_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                        <option value="">Select charge</option>
                        {chargeTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Driver *</label>
                      <select value={newRate.driver_id} onChange={e => setNewRate(p => ({ ...p, driver_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                        <option value="">Select driver</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.unit})</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Rate / Yield *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1000"
                        value={newRate.yield_rate}
                        onChange={e => setNewRate(p => ({ ...p, yield_rate: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                      <select value={newRate.currency} onChange={e => setNewRate(p => ({ ...p, currency: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                    <input
                      placeholder="Optional notes"
                      value={newRate.notes}
                      onChange={e => setNewRate(p => ({ ...p, notes: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Formula preview */}
                  {newRate.yield_rate && newRate.driver_id && (
                    <div className="bg-blue-50 rounded-lg p-3 text-sm">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Revenue Formula</p>
                      <p className="font-mono text-blue-900">
                        {newRate.currency} {parseFloat(newRate.yield_rate || "0").toLocaleString()} × {driverMap[newRate.driver_id]?.name || "Driver"} = <span className="font-bold">Revenue</span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                  <button onClick={() => setShowAddRate(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={addRate}
                    disabled={!newRate.airport_id || !newRate.charge_type_id || !newRate.driver_id || !newRate.yield_rate}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="flex items-center gap-1.5"><Save size={14} /> Save Rate</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== CHARGE TYPES TAB ===== */}
      {tab === "charges" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{chargeTypes.length} charge types configured</p>
            <button onClick={() => setShowAddCharge(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Charge Type
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {chargeTypes.map(ct => {
              const rateCount = rates.filter(r => r.charge_type_id === ct.id).length;
              return (
                <div key={ct.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-blue-200 transition-colors group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Tag size={18} className="text-blue-500" />
                    </div>
                    <button onClick={() => deleteChargeType(ct.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{ct.name}</h3>
                  {ct.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{ct.description}</p>}
                  <p className="text-[10px] text-gray-400 font-mono">{rateCount} rate{rateCount !== 1 ? "s" : ""} configured</p>
                </div>
              );
            })}
          </div>

          {/* Add Charge Type Modal */}
          {showAddCharge && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddCharge(false)}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">Add Charge Type</h2>
                  <button onClick={() => setShowAddCharge(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Charge Name *</label>
                    <input value={newChargeName} onChange={e => setNewChargeName(e.target.value)} placeholder="e.g. Ground Handling Charges" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <input value={newChargeDesc} onChange={e => setNewChargeDesc(e.target.value)} placeholder="Optional description" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                  <button onClick={() => setShowAddCharge(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={addChargeType} disabled={!newChargeName.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
                    Create
                  </button>
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
            <p className="text-sm text-gray-500">{drivers.length} traffic drivers configured</p>
            <button onClick={() => setShowAddDriver(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Driver
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Driver Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Used In</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => {
                  const usedCount = rates.filter(r => r.driver_id === d.id).length;
                  return (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Gauge size={14} className="text-purple-500" />
                          <span className="font-medium text-gray-900">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{d.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{d.description || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500">{usedCount} rate{usedCount !== 1 ? "s" : ""}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteDriver(d.id)} className="text-gray-400 hover:text-red-500 transition-colors" title={usedCount > 0 ? "Remove rates first" : "Delete driver"}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Driver Modal */}
          {showAddDriver && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddDriver(false)}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">Add Traffic Driver</h2>
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
                      <option value="pax">pax</option>
                      <option value="movements">movements</option>
                      <option value="tonnes">tonnes</option>
                      <option value="hours">hours</option>
                      <option value="units">units</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <input value={newDriverDesc} onChange={e => setNewDriverDesc(e.target.value)} placeholder="Optional description" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                  <button onClick={() => setShowAddDriver(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={addDriver} disabled={!newDriverName.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
