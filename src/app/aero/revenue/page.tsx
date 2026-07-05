"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Trash2, X, ChevronDown, ChevronRight,
  Building2, Plane, Tag, Network, Search, Gauge,
} from "lucide-react";

interface Airport { id: string; code: string; name: string; country: string | null; city: string | null; latitude: number | null; longitude: number | null; airport_type: string | null; icao_code: string | null; }
interface GlobalAirport { id: string; iata_code: string; icao_code: string; name: string; country_name: string; city: string; latitude: number; longitude: number; airport_type: string; }
interface Airline { id: string; code: string; name: string; applicable_airports: string[] | null; }
interface Driver { id: string; name: string; unit: string; description: string | null; }
interface ChargeType { id: string; name: string; description: string | null; driver_id: string | null; applicable_airports: string[] | null; }
interface ChargeRate {
  id: string; airport_id: string; airline_id: string | null;
  charge_type_id: string; driver_id: string; yield_rate: number; currency: string;
}

type Tab = "summary" | "airports" | "airlines" | "drivers" | "lines";

export default function RevenueLinesPage() {
  const [tab, setTab] = useState<Tab>("summary");
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [rates, setRates] = useState<ChargeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [expandedAirports, setExpandedAirports] = useState<Set<string>>(new Set());
  const [expandedAirlines, setExpandedAirlines] = useState<Set<string>>(new Set());

  const [showAddAirport, setShowAddAirport] = useState(false);
  const [aptSearch, setAptSearch] = useState("");
  const [aptSearchResults, setAptSearchResults] = useState<GlobalAirport[]>([]);
  const [aptSearching, setAptSearching] = useState(false);

  const [showAirlineModal, setShowAirlineModal] = useState(false);
  const [airlineModalMode, setAirlineModalMode] = useState<"add" | "edit">("add");
  const [airlineModalId, setAirlineModalId] = useState<string | null>(null);
  const [newAlCode, setNewAlCode] = useState("");
  const [newAlName, setNewAlName] = useState("");
  const [newAlAirports, setNewAlAirports] = useState<Set<string>>(new Set());

  const [showAddDriver, setShowAddDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverUnit, setNewDriverUnit] = useState("units");
  const [newDriverDesc, setNewDriverDesc] = useState("");

  const [showLineModal, setShowLineModal] = useState(false);
  const [lineModalMode, setLineModalMode] = useState<"add" | "edit">("add");
  const [lineModalId, setLineModalId] = useState<string | null>(null);
  const [newLineName, setNewLineName] = useState("");
  const [newLineDesc, setNewLineDesc] = useState("");
  const [newLineDriverId, setNewLineDriverId] = useState("");
  const [newLineAirports, setNewLineAirports] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const compRes = await supabase.from("forecast_companies").select("id").limit(1);
    const cid = compRes.data?.[0]?.id;
    if (cid) setCompanyId(cid);
    const [aRes, alRes, dRes, ctRes, rRes] = await Promise.all([
      supabase.from("forecast_airports").select("id, code, name, country, city, latitude, longitude, airport_type, icao_code").order("code"),
      supabase.from("forecast_airlines").select("id, code, name, applicable_airports").order("code"),
      supabase.from("forecast_drivers").select("*").order("name"),
      supabase.from("forecast_charge_types").select("id, name, description, driver_id, applicable_airports").order("sort_order"),
      supabase.from("forecast_charge_rates").select("id, airport_id, airline_id, charge_type_id, driver_id, yield_rate, currency"),
    ]);
    setAirports((aRes.data ?? []) as Airport[]);
    setAirlines((alRes.data ?? []) as Airline[]);
    setDrivers((dRes.data ?? []) as Driver[]);
    setChargeTypes((ctRes.data ?? []) as ChargeType[]);
    setRates((rRes.data ?? []) as ChargeRate[]);
    setLoading(false);
  }

  const existingCodes = useMemo(() => new Set(airports.map(a => a.code)), [airports]);

  useEffect(() => {
    if (!aptSearch || aptSearch.length < 2) { setAptSearchResults([]); return; }
    setAptSearching(true);
    const timer = setTimeout(async () => {
      const q = aptSearch.trim();
      const { data } = await supabase
        .from("airports")
        .select("id, iata_code, icao_code, name, country_name, city, latitude, longitude, airport_type")
        .or(`iata_code.ilike.%${q}%,name.ilike.%${q}%,city.ilike.%${q}%,country_name.ilike.%${q}%,icao_code.ilike.%${q}%`)
        .not("iata_code", "is", null)
        .not("iata_code", "eq", "")
        .order("name")
        .limit(30);
      setAptSearchResults(((data ?? []) as unknown as GlobalAirport[]).filter(ga => !existingCodes.has(ga.iata_code)));
      setAptSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [aptSearch, existingCodes]);

  const chargeMap = useMemo(() => Object.fromEntries(chargeTypes.map(c => [c.id, c])), [chargeTypes]);
  const airlineMap = useMemo(() => Object.fromEntries(airlines.map(a => [a.id, a])), [airlines]);
  const driverMap = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d])), [drivers]);

  const ratesByAirport = useMemo(() => {
    const map: Record<string, ChargeRate[]> = {};
    for (const r of rates) { if (!map[r.airport_id]) map[r.airport_id] = []; map[r.airport_id].push(r); }
    return map;
  }, [rates]);

  function toggleAirport(id: string) {
    setExpandedAirports(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAirline(aptId: string, alId: string) {
    const key = `${aptId}:${alId}`;
    setExpandedAirlines(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  async function addAirportFromGlobal(ga: GlobalAirport) {
    const exists = airports.some(a => a.code === ga.iata_code);
    if (exists) return;
    await supabase.from("forecast_airports").insert({
      company_id: companyId, code: ga.iata_code, name: ga.name,
      country: ga.country_name, city: ga.city,
      latitude: ga.latitude, longitude: ga.longitude,
      airport_type: ga.airport_type, icao_code: ga.icao_code,
    });
    setShowAddAirport(false); setAptSearch(""); loadAll();
  }
  async function deleteAirport(id: string) { await supabase.from("forecast_airports").delete().eq("id", id); loadAll(); }

  function openAddAirlineModal() {
    setAirlineModalMode("add"); setAirlineModalId(null);
    setNewAlCode(""); setNewAlName(""); setNewAlAirports(new Set());
    setShowAirlineModal(true);
  }
  function openEditAirlineModal(al: Airline) {
    setAirlineModalMode("edit"); setAirlineModalId(al.id);
    setNewAlCode(al.code); setNewAlName(al.name);
    setNewAlAirports(new Set(al.applicable_airports || []));
    setShowAirlineModal(true);
  }
  async function saveAirline() {
    if (!newAlCode.trim() || !newAlName.trim()) return;
    const data = { code: newAlCode.trim().toUpperCase(), name: newAlName.trim(), applicable_airports: [...newAlAirports] };
    if (airlineModalMode === "edit" && airlineModalId) {
      await supabase.from("forecast_airlines").update(data).eq("id", airlineModalId);
    } else {
      await supabase.from("forecast_airlines").insert({ ...data, company_id: companyId });
    }
    setShowAirlineModal(false); loadAll();
  }
  async function deleteAirline(id: string) { await supabase.from("forecast_airlines").delete().eq("id", id); loadAll(); }
  function toggleAlAirport(aptId: string) {
    setNewAlAirports(prev => { const n = new Set(prev); n.has(aptId) ? n.delete(aptId) : n.add(aptId); return n; });
  }

  async function addDriver() {
    if (!newDriverName.trim()) return;
    await supabase.from("forecast_drivers").insert({ company_id: companyId, name: newDriverName.trim(), unit: newDriverUnit, description: newDriverDesc.trim() || null });
    setShowAddDriver(false); setNewDriverName(""); setNewDriverUnit("units"); setNewDriverDesc(""); loadAll();
  }
  async function deleteDriver(id: string) { await supabase.from("forecast_drivers").delete().eq("id", id); loadAll(); }
  async function updateDriver(id: string) {
    await supabase.from("forecast_drivers").update({ name: editFields.name, unit: editFields.unit || "units", description: editFields.desc || null }).eq("id", id);
    setEditingId(null); loadAll();
  }

  function openAddLineModal() {
    setLineModalMode("add"); setLineModalId(null);
    setNewLineName(""); setNewLineDesc(""); setNewLineDriverId("");
    setNewLineAirports(new Set());
    setShowLineModal(true);
  }
  function openEditLineModal(ct: ChargeType) {
    setLineModalMode("edit"); setLineModalId(ct.id);
    setNewLineName(ct.name); setNewLineDesc(ct.description || ""); setNewLineDriverId(ct.driver_id || "");
    setNewLineAirports(new Set(ct.applicable_airports || []));
    setShowLineModal(true);
  }
  async function saveRevenueLine() {
    if (!newLineName.trim()) return;
    const data = {
      name: newLineName.trim(),
      description: newLineDesc.trim() || null,
      driver_id: newLineDriverId || null,
      applicable_airports: [...newLineAirports],
    };
    if (lineModalMode === "edit" && lineModalId) {
      await supabase.from("forecast_charge_types").update(data).eq("id", lineModalId);
    } else {
      await supabase.from("forecast_charge_types").insert({ ...data, company_id: companyId, sort_order: chargeTypes.length });
    }
    setShowLineModal(false); loadAll();
  }
  async function deleteRevenueLine(id: string) { await supabase.from("forecast_charge_types").delete().eq("id", id); loadAll(); }
  function toggleLineAirport(aptId: string) {
    setNewLineAirports(prev => { const n = new Set(prev); n.has(aptId) ? n.delete(aptId) : n.add(aptId); return n; });
  }

  function startEdit(id: string, fields: Record<string, string>) {
    setEditingId(id);
    setEditFields(fields);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-gray-900">Revenue Lines</h1>
        <p className="text-sm text-gray-500">Configure your airports, airlines, and revenue line structure</p>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-4 mb-5 text-xs text-gray-400 font-mono flex-wrap">
        <span>{airports.length} airport{airports.length !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span>{airlines.length} airline{airlines.length !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span>{drivers.length} driver{drivers.length !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span>{chargeTypes.length} revenue line{chargeTypes.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {([
          { key: "summary" as Tab, label: "Summary", icon: Network },
          { key: "airports" as Tab, label: "Airports", icon: Building2 },
          { key: "airlines" as Tab, label: "Airlines", icon: Plane },
          { key: "drivers" as Tab, label: "Drivers", icon: Gauge },
          { key: "lines" as Tab, label: "Revenue Lines", icon: Tag },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* ===== SUMMARY TAB ===== */}
      {tab === "summary" && (
        <div>
          <p className="text-xs text-gray-400 mb-4">Visual overview — Airport → Revenue Lines</p>
          {airports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Network size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">No airports configured yet</p>
              <p className="text-xs text-gray-400 mb-4">Start by adding airports, airlines, and revenue lines in the tabs above</p>
              <button onClick={() => setTab("airports")} className="text-blue-600 text-sm font-semibold hover:underline">Add your first airport</button>
            </div>
          ) : (
            <div className="space-y-3">
              {airports.map(apt => {
                const isExpanded = expandedAirports.has(apt.id);
                const linesAtAirport = chargeTypes.filter(ct => {
                  const ctApts = ct.applicable_airports || [];
                  return ctApts.length === 0 || ctApts.includes(apt.id);
                });
                const airlinesAtAirport = airlines.filter(al => {
                  const alApts = al.applicable_airports || [];
                  return alApts.length === 0 || alApts.includes(apt.id);
                });

                return (
                  <div key={apt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div onClick={() => toggleAirport(apt.id)} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-gray-900 text-sm">{apt.code}</span>
                        <span className="text-sm text-gray-500 ml-2">{apt.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono mr-2">{linesAtAirport.length} revenue line{linesAtAirport.length !== 1 ? "s" : ""}</span>
                      {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        {linesAtAirport.length > 0 ? linesAtAirport.map((ct, idx) => {
                          const dr = ct.driver_id ? driverMap[ct.driver_id] : null;
                          return (
                            <div key={ct.id} className={`flex items-center gap-3 px-5 py-2.5 hover:bg-blue-50/30 transition-colors ${idx > 0 ? "border-t border-gray-50" : ""}`}>
                              <div className="w-6 flex justify-center"><div className="w-px h-4 bg-blue-200" /></div>
                              <Tag size={13} className="text-blue-400 shrink-0" />
                              <span className="text-sm font-medium text-gray-800">{ct.name}</span>
                              {dr && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">{dr.name}</span>
                              )}
                            </div>
                          );
                        }) : (
                          <p className="px-5 py-4 text-xs text-gray-400 text-center">No revenue lines configured for this airport yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== AIRPORTS TAB ===== */}
      {tab === "airports" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{airports.length} airport{airports.length !== 1 ? "s" : ""} in your portfolio</p>
            <button onClick={() => { setShowAddAirport(true); setAptSearch(""); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Airport
            </button>
          </div>

          {/* Airport cards */}
          <div className="space-y-4">
            {airports.map(apt => (
              <div key={apt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Satellite Map */}
                  {apt.latitude && apt.longitude && (
                    <div className="sm:w-60 shrink-0 h-44 sm:h-auto bg-gray-900">
                      <iframe
                        src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${apt.latitude},${apt.longitude}&zoom=14&maptype=satellite`}
                        className="w-full h-full border-0"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                  {/* Info */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Building2 size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg font-mono leading-tight">{apt.code}</p>
                          <p className="text-sm text-gray-600">{apt.name}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteAirport(apt.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {apt.code && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">IATA</p>
                          <p className="text-sm font-bold text-gray-900 font-mono">{apt.code}</p>
                        </div>
                      )}
                      {apt.icao_code && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">ICAO</p>
                          <p className="text-sm font-bold text-gray-900 font-mono">{apt.icao_code}</p>
                        </div>
                      )}
                      {apt.country && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Country</p>
                          <p className="text-sm font-medium text-gray-700">{apt.country}</p>
                        </div>
                      )}
                      {apt.city && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">City</p>
                          <p className="text-sm font-medium text-gray-700">{apt.city}</p>
                        </div>
                      )}
                    </div>
                    {apt.latitude && apt.longitude && (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-50 rounded-lg px-3 py-1.5">
                            <span className="text-[10px] text-gray-400">LAT </span>
                            <span className="text-xs font-mono text-gray-700">{apt.latitude.toFixed(6)}</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-3 py-1.5">
                            <span className="text-[10px] text-gray-400">LON </span>
                            <span className="text-xs font-mono text-gray-700">{apt.longitude.toFixed(6)}</span>
                          </div>
                        </div>
                        <a
                          href={`https://www.google.com/maps/@${apt.latitude},${apt.longitude},14z`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          Open in Maps ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Airport Modal — searchable global list */}
          {showAddAirport && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddAirport(false)}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Add Airport</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Search from 4,000+ airports worldwide</p>
                  </div>
                  <button onClick={() => setShowAddAirport(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-4 border-b border-gray-100">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={aptSearch}
                      onChange={e => setAptSearch(e.target.value)}
                      placeholder="Search by code, name, city, or country..."
                      autoFocus
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {aptSearch.length < 2 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Type airport code, name, city, or country</p>
                  ) : aptSearching ? (
                    <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
                  ) : aptSearchResults.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No airports match "{aptSearch}"</p>
                  ) : (
                    aptSearchResults.map(ga => (
                      <button
                        key={ga.id}
                        onClick={() => addAirportFromGlobal(ga)}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-blue-700 font-mono">{ga.iata_code}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{ga.name}</p>
                          <p className="text-xs text-gray-500 truncate">{ga.city}{ga.city && ga.country_name ? ", " : ""}{ga.country_name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {ga.icao_code && <p className="text-[9px] text-gray-500 font-mono font-bold">{ga.icao_code}</p>}
                          <p className="text-[9px] text-gray-400 font-mono">{ga.latitude?.toFixed(2)}, {ga.longitude?.toFixed(2)}</p>
                        </div>
                        <Plus size={14} className="text-blue-500 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== AIRLINES TAB ===== */}
      {tab === "airlines" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{airlines.length} airline{airlines.length !== 1 ? "s" : ""} configured</p>
            <button onClick={openAddAirlineModal} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Airline
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Airline Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Airports</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Charges</th>
                </tr>
              </thead>
              <tbody>
                {airlines.map(al => {
                  const entryCount = rates.filter(r => r.airline_id === al.id).length;
                  const alApts = al.applicable_airports || [];
                  return (
                    <tr key={al.id} onClick={() => openEditAirlineModal(al)} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer">
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono">{al.code}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{al.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {alApts.length > 0 ? alApts.map(aId => {
                            const a = airports.find(x => x.id === aId);
                            return a ? <span key={aId} className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{a.code}</span> : null;
                          }) : <span className="text-[9px] text-gray-400 italic">All airports</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500 text-xs">{entryCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {showAirlineModal && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAirlineModal(false)}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">{airlineModalMode === "edit" ? "Edit Airline" : "Add Airline"}</h2>
                  <button onClick={() => setShowAirlineModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">IATA Code *</label>
                      <input value={newAlCode} onChange={e => setNewAlCode(e.target.value)} placeholder="e.g. EK" maxLength={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 font-mono uppercase" autoFocus />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Airline Name *</label>
                      <input value={newAlName} onChange={e => setNewAlName(e.target.value)} placeholder="e.g. Emirates" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Airports this airline operates at</label>
                    <p className="text-[10px] text-gray-400 mb-2">{newAlAirports.size === 0 ? "Operates at all airports (none selected = all)" : `Operates at ${newAlAirports.size} airport${newAlAirports.size !== 1 ? "s" : ""}`}</p>
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-40 overflow-y-auto">
                      {airports.map(apt => (
                        <label key={apt.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                          <input type="checkbox" checked={newAlAirports.has(apt.id)} onChange={() => toggleAlAirport(apt.id)} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-xs font-mono font-bold text-gray-900">{apt.code}</span>
                          <span className="text-xs text-gray-500 flex-1 truncate">{apt.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-2">
                  {airlineModalMode === "edit" && airlineModalId && (
                    <button onClick={() => { deleteAirline(airlineModalId); setShowAirlineModal(false); }} className="text-xs text-red-500 hover:text-red-700 hover:underline">Delete</button>
                  )}
                  <div className="flex-1" />
                  <button onClick={() => setShowAirlineModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={saveAirline} disabled={!newAlCode.trim() || !newAlName.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                    {airlineModalMode === "edit" ? "Save Changes" : "Add Airline"}
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
            <p className="text-sm text-gray-500">{drivers.length} driver{drivers.length !== 1 ? "s" : ""} — traffic metrics that drive revenue</p>
            <button onClick={() => setShowAddDriver(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Driver
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Driver Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Used By</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => {
                  const usedCount = chargeTypes.filter(c => c.driver_id === d.id).length;
                  const isEd = editingId === d.id;
                  return (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3">
                        {isEd ? <input value={editFields.name || ""} onChange={e => setEditFields(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && updateDriver(d.id)} className="w-full px-2 py-1 rounded border border-blue-400 text-sm text-gray-900 outline-none" autoFocus />
                        : <div className="flex items-center gap-2"><Gauge size={14} className="text-purple-500" /><span className="font-medium text-gray-900">{d.name}</span></div>}
                      </td>
                      <td className="px-4 py-3">
                        {isEd ? <select value={editFields.unit || "units"} onChange={e => setEditFields(p => ({ ...p, unit: e.target.value }))} className="px-2 py-1 rounded border border-blue-400 text-xs text-gray-900 outline-none">
                          <option value="pax">pax</option><option value="movements">movements</option><option value="tonnes">tonnes</option><option value="hours">hours</option><option value="units">units</option><option value="screenings">screenings</option><option value="sqm">sqm</option>
                        </select>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{d.unit}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                        {isEd ? <input value={editFields.desc || ""} onChange={e => setEditFields(p => ({ ...p, desc: e.target.value }))} onKeyDown={e => e.key === "Enter" && updateDriver(d.id)} className="w-full px-2 py-1 rounded border border-blue-400 text-xs text-gray-900 outline-none" />
                        : (d.description || "—")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500 text-xs">{usedCount} line{usedCount !== 1 ? "s" : ""}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isEd ? (
                            <>
                              <button onClick={() => updateDriver(d.id)} className="text-emerald-500 hover:text-emerald-700 text-[10px] font-medium">Save</button>
                              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 text-[10px]">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(d.id, { name: d.name, unit: d.unit, desc: d.description || "" })} className="text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all text-[10px] font-medium">Edit</button>
                              <button onClick={() => deleteDriver(d.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {showAddDriver && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddDriver(false)}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">Add Driver</h2>
                  <button onClick={() => setShowAddDriver(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Driver Name *</label>
                    <input value={newDriverName} onChange={e => setNewDriverName(e.target.value)} placeholder="e.g. Departing Pax Direct" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                    <select value={newDriverUnit} onChange={e => setNewDriverUnit(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500">
                      <option value="pax">pax</option><option value="movements">movements</option><option value="tonnes">tonnes</option><option value="hours">hours</option><option value="units">units</option><option value="screenings">screenings</option><option value="sqm">sqm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <input value={newDriverDesc} onChange={e => setNewDriverDesc(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                  <button onClick={() => setShowAddDriver(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={addDriver} disabled={!newDriverName.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40">Add Driver</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== REVENUE LINES TAB ===== */}
      {tab === "lines" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{chargeTypes.length} revenue line{chargeTypes.length !== 1 ? "s" : ""}</p>
            <button onClick={openAddLineModal} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Revenue Line
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chargeTypes.map(ct => {
              const rateCount = rates.filter(r => r.charge_type_id === ct.id).length;
              const aptCount = (ct.applicable_airports || []).length;
              return (
                <div key={ct.id} onClick={() => openEditLineModal(ct)} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex gap-3">
                    {/* Left content */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Tag size={14} className="text-blue-500" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{ct.name}</h3>
                      {ct.driver_id && driverMap[ct.driver_id] && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium inline-block mt-1">{driverMap[ct.driver_id].name}</span>
                      )}
                      {ct.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ct.description}</p>}
                      <p className="text-[10px] text-gray-400 font-mono mt-2">{rateCount} charge{rateCount !== 1 ? "s" : ""}</p>
                    </div>
                    {/* Right airport codes column */}
                    <div className="flex flex-col gap-1 items-end max-h-24 overflow-y-auto shrink-0 pt-1">
                      {aptCount > 0 ? (
                        (ct.applicable_airports || []).map(aId => {
                          const a = airports.find(x => x.id === aId);
                          return a ? <span key={aId} className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 whitespace-nowrap">{a.code}</span> : null;
                        })
                      ) : (
                        <span className="text-[9px] text-gray-400 italic">All</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add/Edit Revenue Line Modal */}
          {showLineModal && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowLineModal(false)}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">{lineModalMode === "edit" ? "Edit Revenue Line" : "Add Revenue Line"}</h2>
                  <button onClick={() => setShowLineModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Revenue Line Name *</label>
                    <input value={newLineName} onChange={e => setNewLineName(e.target.value)} placeholder="e.g. Landing Charges" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Driver</label>
                    <select value={newLineDriverId} onChange={e => setNewLineDriverId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500">
                      <option value="">Select driver</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.unit})</option>)}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">What traffic metric drives this revenue line?</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <input value={newLineDesc} onChange={e => setNewLineDesc(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Applicable Airports</label>
                    <p className="text-[10px] text-gray-400 mb-2">{newLineAirports.size === 0 ? "Applies to all airports (none selected = all)" : `Applies to ${newLineAirports.size} airport${newLineAirports.size !== 1 ? "s" : ""}`}</p>
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-40 overflow-y-auto">
                      {airports.map(apt => (
                        <label key={apt.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={newLineAirports.has(apt.id)}
                            onChange={() => toggleLineAirport(apt.id)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-mono font-bold text-gray-900">{apt.code}</span>
                          <span className="text-xs text-gray-500 flex-1 truncate">{apt.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-2">
                  {lineModalMode === "edit" && lineModalId && (
                    <button onClick={() => { deleteRevenueLine(lineModalId); setShowLineModal(false); }} className="text-xs text-red-500 hover:text-red-700 hover:underline">Delete</button>
                  )}
                  <div className="flex-1" />
                  <button onClick={() => setShowLineModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={saveRevenueLine} disabled={!newLineName.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                    {lineModalMode === "edit" ? "Save Changes" : "Add"}
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
