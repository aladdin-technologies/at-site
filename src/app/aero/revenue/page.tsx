"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAeroCurrencyConverter } from "@/lib/useAeroCurrency";
import {
  Plus, Trash2, X, ChevronDown, ChevronRight,
  Building2, Plane, Save, Search, Layers,
} from "lucide-react";

interface Driver { id: string; name: string; unit: string; }
interface ChargeType { id: string; name: string; }
interface Airport { id: string; code: string; name: string; }
interface Airline { id: string; code: string; name: string; }
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

const CURRENCIES = ["USD","EUR","GBP","AED","SGD","INR","JPY","AUD","CAD","CHF","SAR","QAR","BHD","KWD","OMR","MYR","THB","CNY","HKD","KRW","SEK","NOK","DKK","NZD","TRY","ZAR","BRL","MXN","IDR","PHP","TWD","PLN","CZK","HUF"];

export default function RevenueLinesPage() {
  const { convert, symbol, baseCurrency } = useAeroCurrencyConverter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [rates, setRates] = useState<ChargeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [expandedAirports, setExpandedAirports] = useState<Set<string>>(new Set());
  const [showAddLine, setShowAddLine] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newLine, setNewLine] = useState({
    airport_id: "", airline_id: "", charge_type_id: "", driver_id: "",
    yield_rate: "", currency: "USD", notes: "",
  });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const compRes = await supabase.from("forecast_companies").select("id").limit(1);
    const cid = compRes.data?.[0]?.id;
    if (cid) setCompanyId(cid);

    const [dRes, ctRes, aRes, alRes, rRes] = await Promise.all([
      supabase.from("forecast_drivers").select("id, name, unit").order("name"),
      supabase.from("forecast_charge_types").select("id, name").order("name"),
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

    if (aRes.data?.length) {
      setExpandedAirports(new Set([(aRes.data[0] as Airport).id]));
    }
  }

  const driverMap = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d])), [drivers]);
  const chargeMap = useMemo(() => Object.fromEntries(chargeTypes.map(c => [c.id, c])), [chargeTypes]);
  const airportMap = useMemo(() => Object.fromEntries(airports.map(a => [a.id, a])), [airports]);
  const airlineMap = useMemo(() => Object.fromEntries(airlines.map(a => [a.id, a])), [airlines]);

  const ratesByAirport = useMemo(() => {
    const map: Record<string, ChargeRate[]> = {};
    for (const r of rates) {
      if (!map[r.airport_id]) map[r.airport_id] = [];
      map[r.airport_id].push(r);
    }
    return map;
  }, [rates]);

  const airportsWithRates = useMemo(() => {
    const aptIds = new Set(rates.map(r => r.airport_id));
    const withRates = airports.filter(a => aptIds.has(a.id));
    const without = airports.filter(a => !aptIds.has(a.id));
    if (!searchQuery) return { withRates, without };
    const q = searchQuery.toLowerCase();
    return {
      withRates: withRates.filter(a => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)),
      without: without.filter(a => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)),
    };
  }, [airports, rates, searchQuery]);

  function toggleAirport(id: string) {
    setExpandedAirports(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function addLine() {
    if (!newLine.airport_id || !newLine.charge_type_id || !newLine.driver_id || !newLine.yield_rate) return;
    await supabase.from("forecast_charge_rates").insert({
      company_id: companyId,
      airport_id: newLine.airport_id,
      airline_id: newLine.airline_id || null,
      charge_type_id: newLine.charge_type_id,
      driver_id: newLine.driver_id,
      yield_rate: parseFloat(newLine.yield_rate),
      currency: newLine.currency,
      notes: newLine.notes || null,
    });
    setShowAddLine(false);
    setNewLine({ airport_id: "", airline_id: "", charge_type_id: "", driver_id: "", yield_rate: "", currency: "USD", notes: "" });
    loadAll();
  }

  async function deleteLine(id: string) {
    await supabase.from("forecast_charge_rates").delete().eq("id", id);
    setRates(prev => prev.filter(r => r.id !== id));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Revenue Lines</h1>
          <p className="text-sm text-gray-500">Configure revenue lines per airport — Airport → Airline → Charge → Driver</p>
        </div>
        <button
          onClick={() => setShowAddLine(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
        >
          <Plus size={16} /> Add Revenue Line
        </button>
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-4 mb-6 text-xs text-gray-400 font-mono">
        <span>{rates.length} revenue lines</span>
        <span>·</span>
        <span>{new Set(rates.map(r => r.airport_id)).size} airports</span>
        <span>·</span>
        <span>{new Set(rates.filter(r => r.airline_id).map(r => r.airline_id)).size} airlines</span>
        <span>·</span>
        <span>{new Set(rates.map(r => r.charge_type_id)).size} charge types</span>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search airports..."
          className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* Airport sections */}
      {rates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Layers size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-1">No revenue lines configured yet</p>
          <p className="text-xs text-gray-400 mb-4">Start by adding a revenue line: pick an airport, airline, charge type, and driver</p>
          <button onClick={() => setShowAddLine(true)} className="text-blue-600 text-sm font-semibold hover:underline">
            Add your first revenue line
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {airportsWithRates.withRates.map(apt => {
            const aptRates = ratesByAirport[apt.id] || [];
            const isExpanded = expandedAirports.has(apt.id);
            const totalRevLines = aptRates.length;
            const airlineCount = new Set(aptRates.filter(r => r.airline_id).map(r => r.airline_id)).size;

            return (
              <div key={apt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Airport header */}
                <button
                  onClick={() => toggleAirport(apt.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{apt.code}</span>
                      <span className="text-sm text-gray-500">{apt.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-mono">{totalRevLines} revenue line{totalRevLines !== 1 ? "s" : ""}</span>
                      {airlineCount > 0 && <span className="text-[10px] text-gray-400 font-mono">{airlineCount} airline{airlineCount !== 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </button>

                {/* Revenue lines table */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/80">
                          <th className="text-left px-5 py-2 text-[10px] font-semibold text-gray-500 uppercase">Airline</th>
                          <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Charge Type</th>
                          <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Driver</th>
                          <th className="text-right px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Rate</th>
                          <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Formula</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {aptRates.map(r => {
                          const al = r.airline_id ? airlineMap[r.airline_id] : null;
                          const ct = chargeMap[r.charge_type_id];
                          const dr = driverMap[r.driver_id];
                          const rate = Number(r.yield_rate);
                          const converted = r.currency !== baseCurrency ? convert(rate, r.currency) : null;

                          return (
                            <tr key={r.id} className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors">
                              <td className="px-5 py-2.5">
                                {al ? (
                                  <div className="flex items-center gap-1.5">
                                    <Plane size={12} className="text-blue-400" />
                                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{al.code}</span>
                                    <span className="text-xs text-gray-500 hidden sm:inline">{al.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">All Airlines</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-xs font-medium text-gray-800">{ct?.name || "—"}</td>
                              <td className="px-3 py-2.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">{dr?.name || "—"}</span>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <p className="font-mono font-semibold text-gray-900 text-xs">
                                  {r.currency} {rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                {converted !== null && (
                                  <p className="text-[9px] text-gray-400 font-mono">≈ {symbol}{converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                  {rate.toFixed(0)} × {dr?.name?.split(" ")[0] || "driver"}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <button onClick={() => deleteLine(r.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="px-5 py-2 border-t border-gray-50">
                      <button
                        onClick={() => { setNewLine(prev => ({ ...prev, airport_id: apt.id })); setShowAddLine(true); }}
                        className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Add line to {apt.code}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Airports with no lines yet */}
          {airportsWithRates.without.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Airports without revenue lines ({airportsWithRates.without.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {airportsWithRates.without.slice(0, 12).map(apt => (
                  <button
                    key={apt.id}
                    onClick={() => { setNewLine(prev => ({ ...prev, airport_id: apt.id })); setShowAddLine(true); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors text-left"
                  >
                    <Building2 size={14} className="text-gray-300" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700">{apt.code}</p>
                      <p className="text-[10px] text-gray-400 truncate">{apt.name}</p>
                    </div>
                    <Plus size={12} className="text-gray-300 ml-auto shrink-0" />
                  </button>
                ))}
              </div>
              {airportsWithRates.without.length > 12 && (
                <p className="text-[10px] text-gray-400 mt-2">+ {airportsWithRates.without.length - 12} more airports</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== ADD REVENUE LINE MODAL ===== */}
      {showAddLine && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddLine(false)}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Add Revenue Line</h2>
                <p className="text-xs text-gray-500 mt-0.5">Airport → Airline → Charge → Driver → Rate</p>
              </div>
              <button onClick={() => setShowAddLine(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Step 1: Airport */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold mr-1.5">1</span>
                  Airport *
                </label>
                <select value={newLine.airport_id} onChange={e => setNewLine(p => ({ ...p, airport_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                  <option value="">Select airport</option>
                  {airports.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
              </div>

              {/* Step 2: Airline */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold mr-1.5">2</span>
                  Airline <span className="text-gray-400 font-normal">(leave blank for all airlines)</span>
                </label>
                <select value={newLine.airline_id} onChange={e => setNewLine(p => ({ ...p, airline_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                  <option value="">All Airlines</option>
                  {airlines.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
              </div>

              {/* Step 3: Charge + Driver */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold mr-1.5">3</span>
                    Charge Type *
                  </label>
                  <select value={newLine.charge_type_id} onChange={e => setNewLine(p => ({ ...p, charge_type_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                    <option value="">Select charge</option>
                    {chargeTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold mr-1.5">4</span>
                    Driver *
                  </label>
                  <select value={newLine.driver_id} onChange={e => setNewLine(p => ({ ...p, driver_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                    <option value="">Select driver</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.unit})</option>)}
                  </select>
                </div>
              </div>

              {/* Rate + Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rate / Yield *</label>
                  <input
                    type="number" step="0.01" placeholder="e.g. 1000"
                    value={newLine.yield_rate}
                    onChange={e => setNewLine(p => ({ ...p, yield_rate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
                  <select value={newLine.currency} onChange={e => setNewLine(p => ({ ...p, currency: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                <input
                  placeholder="Optional notes"
                  value={newLine.notes}
                  onChange={e => setNewLine(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Formula preview */}
              {newLine.yield_rate && newLine.driver_id && newLine.charge_type_id && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Revenue Formula</p>
                  <p className="font-mono text-sm text-blue-900">
                    <span className="font-bold">{chargeMap[newLine.charge_type_id]?.name}</span>
                    {" = "}
                    {newLine.currency} {parseFloat(newLine.yield_rate || "0").toLocaleString()}
                    {" × "}
                    {driverMap[newLine.driver_id]?.name}
                  </p>
                  {newLine.airport_id && (
                    <p className="text-[10px] text-blue-600 mt-1">
                      @ {airportMap[newLine.airport_id]?.code}
                      {newLine.airline_id ? ` · ${airlineMap[newLine.airline_id]?.code}` : " · All Airlines"}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowAddLine(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={addLine}
                disabled={!newLine.airport_id || !newLine.charge_type_id || !newLine.driver_id || !newLine.yield_rate}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="flex items-center gap-1.5"><Save size={14} /> Save Revenue Line</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
