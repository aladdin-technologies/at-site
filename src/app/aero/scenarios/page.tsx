"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, BarChart3, Clock, Check, Archive } from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  base_year: number;
  forecast_years: number;
  growth_assumptions: { pax_growth?: number; movement_growth?: number };
  yield_assumptions: { annual_escalation?: number };
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-500",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: Clock,
  published: Check,
  archived: Archive,
};

export default function ScenariosPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPaxGrowth, setNewPaxGrowth] = useState("4.5");
  const [newYieldEsc, setNewYieldEsc] = useState("3.0");

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/aero/login"); return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    loadScenarios();
  }, [authorized]);

  async function loadScenarios() {
    const { data } = await supabase.from("forecast_scenarios").select("*").order("created_at", { ascending: false });
    setScenarios((data ?? []) as Scenario[]);
    setLoading(false);
  }

  async function createScenario() {
    if (!newName.trim()) return;
    const compRes = await supabase.from("forecast_companies").select("id").limit(1);
    const companyId = compRes.data?.[0]?.id;
    if (!companyId) return;

    await supabase.from("forecast_scenarios").insert({
      company_id: companyId,
      name: newName,
      description: newDesc || null,
      base_year: 2025,
      forecast_years: 3,
      growth_assumptions: { pax_growth: parseFloat(newPaxGrowth) || 4.5, movement_growth: (parseFloat(newPaxGrowth) || 4.5) * 0.7 },
      yield_assumptions: { annual_escalation: parseFloat(newYieldEsc) || 3.0 },
      status: "draft",
    });

    setShowCreate(false);
    setNewName("");
    setNewDesc("");
    loadScenarios();
  }

  if (!authorized) return null;
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900"><ArrowLeft size={18} /></button>
            <span className="text-sm font-bold text-gray-900">Forecast Scenarios</span>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
            <Plus size={14} /> New Scenario
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Create New Scenario</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Scenario Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Base Case 2026" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional description" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Pax Growth (%/year)</label>
                <input value={newPaxGrowth} onChange={e => setNewPaxGrowth(e.target.value)} type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Yield Escalation (%/year)</label>
                <input value={newYieldEsc} onChange={e => setNewYieldEsc(e.target.value)} type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 font-mono" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createScenario} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">Create Scenario</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        {/* Scenarios list */}
        <div className="space-y-3">
          {scenarios.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BarChart3 size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No scenarios created yet</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-blue-600 text-sm font-semibold hover:underline">Create your first scenario</button>
            </div>
          ) : (
            scenarios.map(s => {
              const StatusIcon = STATUS_ICONS[s.status] || Clock;
              return (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{s.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[s.status]}`}>
                          <StatusIcon size={10} /> {s.status}
                        </span>
                      </div>
                      {s.description && <p className="text-xs text-gray-500 mb-2">{s.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Base: {s.base_year}</span>
                        <span>Forecast: {s.forecast_years} years</span>
                        <span>Pax growth: {s.growth_assumptions?.pax_growth ?? 0}%</span>
                        <span>Yield esc: {s.yield_assumptions?.annual_escalation ?? 0}%</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
