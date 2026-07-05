"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, Users, Save, Plus, Trash2, Mail, Search, Check, ChevronDown, Globe, Shield, Eye, Lock } from "lucide-react";
import { useAeroCurrency, setAeroCurrency } from "@/lib/useAeroCurrency";
import { useExchangeRates } from "@/lib/useCurrency";
import { TAB_KEYS, TAB_LABELS, type AccessLevel, type TabPermissions } from "@/lib/usePermissions";

const MAJORS = ["USD", "EUR", "GBP", "AED", "INR", "SAR", "AUD", "CAD", "SGD", "JPY", "CNY", "CHF", "HKD", "KRW", "THB", "MYR", "SEK", "NOK", "DKK", "NZD", "TRY", "ZAR", "BRL", "MXN", "QAR", "BHD", "KWD", "OMR", "IDR", "PHP", "TWD", "PLN", "CZK", "HUF"];

const CURRENCY_COUNTRY: Record<string, string | null> = {
  EUR: "eu", XAF: null, XOF: null, XPF: null, XCD: null, XDR: null,
};

function currencyCountry(code: string): string | null {
  if (code in CURRENCY_COUNTRY) return CURRENCY_COUNTRY[code];
  return code.slice(0, 2).toLowerCase();
}

let _dn: Intl.DisplayNames | null | undefined;
function currencyName(code: string): string {
  if (_dn === undefined) { try { _dn = new Intl.DisplayNames(["en"], { type: "currency" }); } catch { _dn = null; } }
  try { const n = _dn?.of(code); if (n && n.toUpperCase() !== code) return n; } catch {}
  return code;
}

function FlagImg({ code, size = 20 }: { code: string; size?: number }) {
  const country = currencyCountry(code);
  if (!country) return <span className="w-5 h-4 rounded-sm bg-gray-100 flex items-center justify-center text-[8px] text-gray-400 font-bold">{code.slice(0, 1)}</span>;
  return <img src={`https://flagcdn.com/w40/${country}.png`} alt={country} width={size} height={size * 0.75} className="rounded-sm object-cover" style={{ width: size, height: size * 0.75 }} />;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"general" | "team">("general");
  const baseCurrency = useAeroCurrency();
  const rates = useExchangeRates();

  useEffect(() => {
    if (searchParams.get("tab") === "team") setTab("team");
  }, [searchParams]);

  const [inflation, setInflation] = useState("3.0");
  const [yieldGrowth, setYieldGrowth] = useState("2.5");
  const [trafficGrowth, setTrafficGrowth] = useState("5.0");
  const [fiscalStart, setFiscalStart] = useState("January");
  const [saved, setSaved] = useState(false);

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setCurrencyOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allCurrencies = useMemo(() => {
    const all = Object.keys(rates).sort();
    const majorSet = new Set(MAJORS);
    const rest = all.filter(c => !majorSet.has(c));
    return [...MAJORS.filter(c => rates[c]), ...rest];
  }, [rates]);

  const filteredCurrencies = useMemo(() => {
    if (!currencySearch) return allCurrencies;
    const q = currencySearch.toLowerCase();
    return allCurrencies.filter(c => c.toLowerCase().includes(q) || currencyName(c).toLowerCase().includes(q));
  }, [allCurrencies, currencySearch]);

  const [inviteEmail, setInviteEmail] = useState("");

  interface TeamMember {
    name: string; email: string; role: string; joined: string;
    permissions: TabPermissions;
  }

  const allFull: TabPermissions = { dashboard: "full", analytics: "full", historicals: "full", budget: "full", scenarios: "full", charges: "full", revenue: "full", settings: "full" };
  const analystDefault: TabPermissions = { dashboard: "full", analytics: "full", historicals: "full", budget: "view", scenarios: "full", charges: "view", revenue: "view", settings: "none" };
  const viewerDefault: TabPermissions = { dashboard: "view", analytics: "view", historicals: "view", budget: "view", scenarios: "view", charges: "view", revenue: "view", settings: "none" };

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: "Demo User", email: "demo@airportronics.com", role: "Admin", joined: "Jun 2025", permissions: allFull },
    { name: "Sarah Chen", email: "sarah.chen@example.com", role: "Analyst", joined: "Jul 2025", permissions: analystDefault },
    { name: "James Wright", email: "j.wright@example.com", role: "Viewer", joined: "Aug 2025", permissions: viewerDefault },
  ]);
  const [editingMember, setEditingMember] = useState<string | null>(null);

  function updateMemberPerm(email: string, tab: keyof TabPermissions, level: AccessLevel) {
    setTeamMembers(prev => prev.map(m => {
      if (m.email !== email) return m;
      const newPerms = { ...m.permissions, [tab]: level };
      const hasAnyFull = TAB_KEYS.some(k => newPerms[k] === "full");
      const allView = TAB_KEYS.every(k => newPerms[k] === "view" || newPerms[k] === "none");
      return { ...m, permissions: newPerms, role: m.role === "Admin" ? "Admin" : hasAnyFull ? "Analyst" : allView ? "Viewer" : "Custom" };
    }));
  }

  function setPreset(email: string, preset: "admin" | "analyst" | "viewer") {
    const perms = preset === "admin" ? allFull : preset === "analyst" ? analystDefault : viewerDefault;
    setTeamMembers(prev => prev.map(m => m.email === email ? { ...m, permissions: perms, role: preset === "admin" ? "Admin" : preset === "analyst" ? "Analyst" : "Viewer" } : m));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your forecasting parameters and team</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab("general")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "general" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Settings size={16} /> General
        </button>
        <button
          onClick={() => setTab("team")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "team" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users size={16} /> Team
        </button>
      </div>

      {tab === "general" && (
        <div className="space-y-6">
          {/* Base Currency */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900">Base Currency</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">All monetary values across the tool will be displayed in this currency using live exchange rates.</p>

            <div ref={currencyRef} className="relative">
              <button
                onClick={() => { setCurrencyOpen(!currencyOpen); setCurrencySearch(""); }}
                className="w-full sm:w-80 flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-left"
              >
                <FlagImg code={baseCurrency} size={24} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 font-mono">{baseCurrency}</span>
                  <span className="text-sm text-gray-500 ml-2">{currencyName(baseCurrency)}</span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${currencyOpen ? "rotate-180" : ""}`} />
              </button>

              {currencyOpen && (
                <div className="absolute z-50 mt-1 w-full sm:w-80 bg-white rounded-xl border border-gray-200 shadow-xl shadow-black/10 overflow-hidden">
                  {/* Search */}
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search ${allCurrencies.length} currencies...`}
                        value={currencySearch}
                        onChange={e => setCurrencySearch(e.target.value)}
                        autoFocus
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm outline-none focus:border-blue-400 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Currency list */}
                  <div className="max-h-72 overflow-y-auto">
                    {filteredCurrencies.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-6">No currencies match "{currencySearch}"</p>
                    )}
                    {filteredCurrencies.map(code => {
                      const isSelected = code === baseCurrency;
                      const isMajor = MAJORS.includes(code);
                      return (
                        <button
                          key={code}
                          onClick={() => { setAeroCurrency(code); setCurrencyOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}
                        >
                          <FlagImg code={code} />
                          <span className="text-sm font-mono font-semibold text-gray-900 w-10">{code}</span>
                          <span className="text-sm text-gray-500 flex-1 truncate">{currencyName(code)}</span>
                          {rates[code] && code !== "USD" && (
                            <span className="text-[10px] text-gray-400 font-mono">{rates[code].toFixed(4)}</span>
                          )}
                          {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-[10px] text-gray-400">Live rates via Frankfurter API — updated hourly</p>
                  </div>
                </div>
              )}
            </div>

            {baseCurrency !== "USD" && rates[baseCurrency] && (
              <p className="text-xs text-gray-500 mt-3">
                1 USD = {rates[baseCurrency].toFixed(4)} {baseCurrency} · Rate updates automatically every hour
              </p>
            )}
          </div>

          {/* Forecast Parameters */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Forecast Parameters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Inflation Rate (%)</label>
                <input type="number" step="0.1" value={inflation} onChange={(e) => setInflation(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Yield Growth Rate (%)</label>
                <input type="number" step="0.1" value={yieldGrowth} onChange={(e) => setYieldGrowth(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Traffic Growth Rate (%)</label>
                <input type="number" step="0.1" value={trafficGrowth} onChange={(e) => setTrafficGrowth(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
            </div>
          </div>

          {/* Financial Year */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Financial Year</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fiscal Year Starts</label>
                <select value={fiscalStart} onChange={(e) => setFiscalStart(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500">
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            <Save size={16} />
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      )}

      {tab === "team" && (
        <div className="space-y-6">
          {/* Invite */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Invite Team Member</h2>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                <Plus size={16} /> Invite
              </button>
            </div>
          </div>

          {/* Team members with granular permissions */}
          <div className="space-y-4">
            {teamMembers.map((m) => {
              const isEditing = editingMember === m.email;
              return (
                <div key={m.email} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Member header */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        m.role === "Admin" ? "bg-blue-50 text-blue-700" :
                        m.role === "Analyst" ? "bg-emerald-50 text-emerald-700" :
                        m.role === "Viewer" ? "bg-gray-100 text-gray-600" :
                        "bg-amber-50 text-amber-700"
                      }`}>{m.role}</span>
                      {m.role !== "Admin" && (
                        <button
                          onClick={() => setEditingMember(isEditing ? null : m.email)}
                          className="text-xs text-blue-600 font-medium hover:underline"
                        >
                          {isEditing ? "Close" : "Edit Access"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Granular permissions grid */}
                  {isEditing && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                      {/* Presets */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mr-2">Presets:</span>
                        {(["admin", "analyst", "viewer"] as const).map(preset => (
                          <button
                            key={preset}
                            onClick={() => setPreset(m.email, preset)}
                            className="text-[10px] px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors capitalize"
                          >
                            {preset === "admin" ? "Full Access" : preset === "analyst" ? "Analyst" : "View Only"}
                          </button>
                        ))}
                      </div>

                      {/* Permission grid */}
                      <div className="space-y-1.5">
                        {TAB_KEYS.map(tabKey => {
                          const level = m.permissions[tabKey];
                          return (
                            <div key={tabKey} className="flex items-center gap-3 py-1">
                              <span className="text-xs text-gray-700 font-medium w-28">{TAB_LABELS[tabKey]}</span>
                              <div className="flex gap-1">
                                {([
                                  { val: "none" as AccessLevel, label: "No Access", icon: Lock, color: "text-red-600 bg-red-50 border-red-200" },
                                  { val: "view" as AccessLevel, label: "View Only", icon: Eye, color: "text-amber-600 bg-amber-50 border-amber-200" },
                                  { val: "full" as AccessLevel, label: "Full Access", icon: Shield, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                                ]).map(opt => {
                                  const isActive = level === opt.val;
                                  return (
                                    <button
                                      key={opt.val}
                                      onClick={() => updateMemberPerm(m.email, tabKey, opt.val)}
                                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                                        isActive ? opt.color : "text-gray-400 bg-white border-gray-100 hover:border-gray-300"
                                      }`}
                                    >
                                      <opt.icon size={10} />
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                        <p className="text-[10px] text-gray-400 flex-1">
                          <Lock size={10} className="inline mr-0.5" /> No Access = tab hidden &nbsp;
                          <Eye size={10} className="inline mr-0.5" /> View Only = read-only, edits greyed out &nbsp;
                          <Shield size={10} className="inline mr-0.5" /> Full Access = read + write
                        </p>
                        {m.role !== "Admin" && (
                          <button onClick={() => setTeamMembers(prev => prev.filter(x => x.email !== m.email))} className="text-[10px] text-red-500 hover:underline">Remove</button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Compact permission summary when not editing */}
                  {!isEditing && m.role !== "Admin" && (
                    <div className="border-t border-gray-50 px-5 py-2 flex items-center gap-1 flex-wrap">
                      {TAB_KEYS.map(tabKey => {
                        const level = m.permissions[tabKey];
                        if (level === "none") return null;
                        return (
                          <span key={tabKey} className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            level === "full" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"
                          }`}>
                            {TAB_LABELS[tabKey]}{level === "view" ? " 👁" : ""}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
