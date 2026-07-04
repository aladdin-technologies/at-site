"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, Users, Save, Plus, Trash2, Mail, Search, Check, ChevronDown, Globe } from "lucide-react";
import { useAeroCurrency, setAeroCurrency } from "@/lib/useAeroCurrency";
import { useExchangeRates } from "@/lib/useCurrency";

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
  const [teamMembers] = useState([
    { name: "Demo User", email: "demo@airportronics.com", role: "Admin", joined: "Jun 2025" },
    { name: "Sarah Chen", email: "sarah.chen@example.com", role: "Analyst", joined: "Jul 2025" },
    { name: "James Wright", email: "j.wright@example.com", role: "Viewer", joined: "Aug 2025" },
  ]);

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
                <input type="number" step="0.1" value={inflation} onChange={(e) => setInflation(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Yield Growth Rate (%)</label>
                <input type="number" step="0.1" value={yieldGrowth} onChange={(e) => setYieldGrowth(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Traffic Growth Rate (%)</label>
                <input type="number" step="0.1" value={trafficGrowth} onChange={(e) => setTrafficGrowth(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
            </div>
          </div>

          {/* Financial Year */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Financial Year</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fiscal Year Starts</label>
                <select value={fiscalStart} onChange={(e) => setFiscalStart(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
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
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              <select className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none">
                <option>Analyst</option>
                <option>Viewer</option>
                <option>Admin</option>
              </select>
              <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                <Plus size={16} /> Invite
              </button>
            </div>
          </div>

          {/* Team list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Joined</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((m) => (
                  <tr key={m.email} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        m.role === "Admin" ? "bg-blue-50 text-blue-700" :
                        m.role === "Analyst" ? "bg-emerald-50 text-emerald-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{m.joined}</td>
                    <td className="px-4 py-3">
                      {m.role !== "Admin" && (
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
