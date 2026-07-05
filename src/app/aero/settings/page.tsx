"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, Users, Save, Plus, Trash2, Mail, Search, Check, ChevronDown, Globe, Shield, Eye, Lock, KeyRound } from "lucide-react";
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

interface AccessCategory {
  id: string;
  name: string;
  permissions: TabPermissions;
}

interface TeamMember {
  name: string;
  email: string;
  categoryId: string;
  joined: string;
}

type Tab = "general" | "team" | "access";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("general");
  const baseCurrency = useAeroCurrency();
  const rates = useExchangeRates();

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "team") setTab("team");
    if (t === "access") setTab("access");
  }, [searchParams]);

  // General settings
  const [inflation, setInflation] = useState("3.0");
  const [yieldGrowth, setYieldGrowth] = useState("2.5");
  const [trafficGrowth, setTrafficGrowth] = useState("5.0");
  const [fiscalStart, setFiscalStart] = useState("January");
  const [saved, setSaved] = useState(false);

  // Currency picker
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
    return [...MAJORS.filter(c => rates[c]), ...all.filter(c => !majorSet.has(c))];
  }, [rates]);
  const filteredCurrencies = useMemo(() => {
    if (!currencySearch) return allCurrencies;
    const q = currencySearch.toLowerCase();
    return allCurrencies.filter(c => c.toLowerCase().includes(q) || currencyName(c).toLowerCase().includes(q));
  }, [allCurrencies, currencySearch]);

  // Access Rights categories
  const [categories, setCategories] = useState<AccessCategory[]>([
    { id: "admin", name: "Administrator", permissions: { dashboard: "full", analytics: "full", historicals: "full", budget: "full", scenarios: "full", charges: "full", revenue: "full", settings: "full" } },
    { id: "finance", name: "Finance", permissions: { dashboard: "full", analytics: "full", historicals: "full", budget: "full", scenarios: "view", charges: "view", revenue: "view", settings: "none" } },
    { id: "analyst", name: "Analyst", permissions: { dashboard: "full", analytics: "full", historicals: "full", budget: "view", scenarios: "full", charges: "view", revenue: "view", settings: "none" } },
    { id: "executive", name: "Executive", permissions: { dashboard: "full", analytics: "full", historicals: "view", budget: "view", scenarios: "view", charges: "none", revenue: "none", settings: "none" } },
    { id: "viewer", name: "Viewer", permissions: { dashboard: "view", analytics: "view", historicals: "view", budget: "view", scenarios: "view", charges: "view", revenue: "view", settings: "none" } },
  ]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Team
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCategoryId, setInviteCategoryId] = useState("analyst");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: "Demo Admin", email: "demo@airportronics.com", categoryId: "admin", joined: "Jun 2025" },
    { name: "Sarah Chen", email: "sarah.chen@example.com", categoryId: "finance", joined: "Jul 2025" },
    { name: "James Wright", email: "j.wright@example.com", categoryId: "viewer", joined: "Aug 2025" },
  ]);

  const categoryMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);

  function addCategory() {
    if (!newCatName.trim()) return;
    const id = newCatName.trim().toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    setCategories(prev => [...prev, {
      id,
      name: newCatName.trim(),
      permissions: { dashboard: "view", analytics: "view", historicals: "view", budget: "view", scenarios: "view", charges: "view", revenue: "view", settings: "none" },
    }]);
    setShowAddCategory(false);
    setNewCatName("");
    setEditingCategory(id);
  }

  function updateCategoryPerm(catId: string, tabKey: keyof TabPermissions, level: AccessLevel) {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, permissions: { ...c.permissions, [tabKey]: level } } : c));
  }

  function deleteCategory(catId: string) {
    if (catId === "admin") return;
    const assignedCount = teamMembers.filter(m => m.categoryId === catId).length;
    if (assignedCount > 0) return;
    setCategories(prev => prev.filter(c => c.id !== catId));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Manage configuration, team, and access rights</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button onClick={() => setTab("general")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "general" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <Settings size={16} /> General
        </button>
        <button onClick={() => setTab("team")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "team" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <Users size={16} /> Team
        </button>
        <button onClick={() => setTab("access")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "access" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <KeyRound size={16} /> Access Rights
        </button>
      </div>

      {/* ===== GENERAL TAB ===== */}
      {tab === "general" && (
        <div className="space-y-6">
          {/* Base Currency */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900">Base Currency</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">All monetary values will be displayed in this currency using live exchange rates.</p>
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
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder={`Search ${allCurrencies.length} currencies...`} value={currencySearch} onChange={e => setCurrencySearch(e.target.value)} autoFocus className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-900 outline-none focus:border-blue-400 focus:bg-white" />
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {filteredCurrencies.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No match</p>}
                    {filteredCurrencies.map(code => (
                      <button key={code} onClick={() => { setAeroCurrency(code); setCurrencyOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-50 transition-colors ${code === baseCurrency ? "bg-blue-50" : ""}`}>
                        <FlagImg code={code} />
                        <span className="text-sm font-mono font-semibold text-gray-900 w-10">{code}</span>
                        <span className="text-sm text-gray-500 flex-1 truncate">{currencyName(code)}</span>
                        {code === baseCurrency && <Check size={14} className="text-blue-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-[10px] text-gray-400">Live rates via Frankfurter API — updated hourly</p>
                  </div>
                </div>
              )}
            </div>
            {baseCurrency !== "USD" && rates[baseCurrency] && (
              <p className="text-xs text-gray-500 mt-3">1 USD = {rates[baseCurrency].toFixed(4)} {baseCurrency}</p>
            )}
          </div>

          {/* Forecast Parameters */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Forecast Parameters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Inflation Rate (%)</label>
                <input type="number" step="0.1" value={inflation} onChange={e => setInflation(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Yield Growth Rate (%)</label>
                <input type="number" step="0.1" value={yieldGrowth} onChange={e => setYieldGrowth(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Traffic Growth Rate (%)</label>
                <input type="number" step="0.1" value={trafficGrowth} onChange={e => setTrafficGrowth(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
            </div>
          </div>

          {/* Financial Year */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Financial Year</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fiscal Year Starts</label>
                <select value={fiscalStart} onChange={e => setFiscalStart(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500">
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            <Save size={16} /> {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      )}

      {/* ===== TEAM TAB ===== */}
      {tab === "team" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Invite Team Member</h2>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500" />
              </div>
              <select value={inviteCategoryId} onChange={e => setInviteCategoryId(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                <Plus size={16} /> Invite
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Access Rights</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Joined</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map(m => {
                  const cat = categoryMap[m.categoryId];
                  return (
                    <tr key={m.email} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{m.name}</p>
                            <p className="text-xs text-gray-500">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={m.categoryId}
                          onChange={e => setTeamMembers(prev => prev.map(x => x.email === m.email ? { ...x, categoryId: e.target.value } : x))}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 font-medium outline-none focus:border-blue-500"
                        >
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{m.joined}</td>
                      <td className="px-4 py-3">
                        {m.categoryId !== "admin" && (
                          <button onClick={() => setTeamMembers(prev => prev.filter(x => x.email !== m.email))} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400">
            Manage access right categories in the <button onClick={() => setTab("access")} className="text-blue-600 font-medium hover:underline">Access Rights</button> tab.
          </p>
        </div>
      )}

      {/* ===== ACCESS RIGHTS TAB ===== */}
      {tab === "access" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Define access right categories — each category controls which tabs a user can see and edit</p>
            <button onClick={() => setShowAddCategory(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} /> New Rights
            </button>
          </div>

          {categories.map(cat => {
            const isEditing = editingCategory === cat.id;
            const memberCount = teamMembers.filter(m => m.categoryId === cat.id).length;
            const isAdmin = cat.id === "admin";

            return (
              <div key={cat.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group/card">
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setEditingCategory(isEditing ? null : cat.id)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isAdmin ? "bg-blue-50" : "bg-gray-50"}`}>
                      <KeyRound size={16} className={isAdmin ? "text-blue-500" : "text-gray-400"} />
                    </div>
                    <div>
                      {renamingCategory === cat.id ? (
                        <input
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && renameValue.trim()) {
                              setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: renameValue.trim() } : c));
                              setRenamingCategory(null);
                            }
                            if (e.key === "Escape") setRenamingCategory(null);
                          }}
                          onBlur={() => {
                            if (renameValue.trim()) setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: renameValue.trim() } : c));
                            setRenamingCategory(null);
                          }}
                          onClick={e => e.stopPropagation()}
                          autoFocus
                          className="text-sm font-semibold text-gray-900 px-2 py-0.5 rounded border border-blue-400 outline-none w-48"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                      )}
                      <p className="text-[10px] text-gray-400">{memberCount} member{memberCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isAdmin && renamingCategory !== cat.id && (
                      <button
                        onClick={e => { e.stopPropagation(); setRenamingCategory(cat.id); setRenameValue(cat.name); }}
                        className="text-[10px] text-gray-400 hover:text-blue-600 opacity-0 group-hover/card:opacity-100 transition-all"
                      >
                        Rename
                      </button>
                    )}
                    {!isAdmin && (
                      memberCount > 0 ? (
                        <span className="text-[9px] text-gray-400 opacity-0 group-hover/card:opacity-100 transition-all" title={`Cannot delete — ${memberCount} member${memberCount !== 1 ? "s" : ""} assigned`}>
                          <Lock size={12} className="inline text-gray-300" />
                        </span>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-all"
                          title="Delete this access rights category"
                        >
                          <Trash2 size={14} />
                        </button>
                      )
                    )}
                    {isAdmin && <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">SYSTEM</span>}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isEditing ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {isEditing && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/30">
                    <div className="space-y-1.5">
                      {TAB_KEYS.map(tabKey => {
                        const level = cat.permissions[tabKey];
                        return (
                          <div key={tabKey} className="flex items-center gap-3 py-1">
                            <span className="text-xs text-gray-700 font-medium w-28">{TAB_LABELS[tabKey]}</span>
                            <div className="flex gap-1">
                              {([
                                { val: "none" as AccessLevel, label: "No Access", icon: Lock, activeClass: "text-red-600 bg-red-50 border-red-200" },
                                { val: "view" as AccessLevel, label: "View Only", icon: Eye, activeClass: "text-amber-600 bg-amber-50 border-amber-200" },
                                { val: "full" as AccessLevel, label: "Full Access", icon: Shield, activeClass: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                              ]).map(opt => (
                                <button
                                  key={opt.val}
                                  onClick={() => !isAdmin && updateCategoryPerm(cat.id, tabKey, opt.val)}
                                  disabled={isAdmin}
                                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                                    level === opt.val ? opt.activeClass : "text-gray-400 bg-white border-gray-100 hover:border-gray-300"
                                  } ${isAdmin ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  <opt.icon size={10} /> {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-[10px] text-gray-400">
                        <Lock size={10} className="inline mr-0.5" /> No Access = tab hidden &nbsp;
                        <Eye size={10} className="inline mr-0.5" /> View Only = read-only &nbsp;
                        <Shield size={10} className="inline mr-0.5" /> Full Access = read + write
                      </p>
                      {!isAdmin && memberCount === 0 && (
                        <button onClick={() => deleteCategory(cat.id)} className="text-[10px] text-red-500 hover:underline">Delete</button>
                      )}
                      {!isAdmin && memberCount > 0 && (
                        <span className="text-[10px] text-gray-400">Cannot delete — {memberCount} member{memberCount !== 1 ? "s" : ""} assigned. Reassign them first.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add category modal */}
          {showAddCategory && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddCategory(false)}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">New Access Rights</h2>
                </div>
                <div className="p-6">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category Name</label>
                  <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Finance, Operations, Executive" autoFocus onKeyDown={e => { if (e.key === "Enter") addCategory(); }} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500" />
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                  <button onClick={() => setShowAddCategory(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={addCategory} disabled={!newCatName.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40">Create</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
