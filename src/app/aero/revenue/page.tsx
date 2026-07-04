"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Trash2, X, ChevronDown, ChevronRight,
  FolderTree, Layers, Tag, GripVertical,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface ChargeType {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  sort_order: number;
}

export default function RevenueStructurePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [charges, setCharges] = useState<ChargeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddLine, setShowAddLine] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newLineName, setNewLineName] = useState("");
  const [newLineDesc, setNewLineDesc] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const compRes = await supabase.from("forecast_companies").select("id").limit(1);
    const cid = compRes.data?.[0]?.id;
    if (cid) setCompanyId(cid);

    const [catRes, chRes] = await Promise.all([
      supabase.from("forecast_revenue_categories").select("*").order("sort_order"),
      supabase.from("forecast_charge_types").select("*").order("sort_order"),
    ]);
    const cats = (catRes.data ?? []) as Category[];
    setCategories(cats);
    setCharges((chRes.data ?? []) as ChargeType[]);
    setExpanded(new Set(cats.map(c => c.id)));
    setLoading(false);
  }

  const chargesByCategory = useMemo(() => {
    const map: Record<string, ChargeType[]> = {};
    for (const c of charges) {
      const key = c.category_id || "uncategorized";
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [charges]);

  const uncategorized = chargesByCategory["uncategorized"] || [];

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    await supabase.from("forecast_revenue_categories").insert({
      company_id: companyId,
      name: newCatName.trim(),
      sort_order: categories.length,
    });
    setShowAddCategory(false);
    setNewCatName("");
    loadAll();
  }

  async function deleteCategory(id: string) {
    await supabase.from("forecast_charge_types").update({ category_id: null }).eq("category_id", id);
    await supabase.from("forecast_revenue_categories").delete().eq("id", id);
    loadAll();
  }

  async function addRevenueLine(categoryId: string) {
    if (!newLineName.trim()) return;
    await supabase.from("forecast_charge_types").insert({
      company_id: companyId,
      name: newLineName.trim(),
      description: newLineDesc.trim() || null,
      category_id: categoryId,
      sort_order: (chargesByCategory[categoryId]?.length || 0),
    });
    setShowAddLine(null);
    setNewLineName("");
    setNewLineDesc("");
    loadAll();
  }

  async function deleteLine(id: string) {
    await supabase.from("forecast_charge_types").delete().eq("id", id);
    setCharges(prev => prev.filter(c => c.id !== id));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Revenue Structure</h1>
          <p className="text-sm text-gray-500">Define what businesses and revenue lines exist at your airports</p>
        </div>
        <button
          onClick={() => setShowAddCategory(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-6">
        Revenue Category → Revenue Line → connects to Charges (configured in the Charges tab)
      </p>

      {/* Tree */}
      <div className="space-y-3">
        {categories.map(cat => {
          const lines = chargesByCategory[cat.id] || [];
          const isExpanded = expanded.has(cat.id);

          return (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Category header */}
              <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                <div
                  onClick={() => toggleExpand(cat.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    cat.name.toLowerCase().includes("non") ? "bg-emerald-50" : "bg-blue-50"
                  }`}>
                    <FolderTree size={18} className={cat.name.toLowerCase().includes("non") ? "text-emerald-500" : "text-blue-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{cat.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{lines.length} revenue line{lines.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                  title="Delete category"
                >
                  <Trash2 size={14} />
                </button>
                <div onClick={() => toggleExpand(cat.id)} className="cursor-pointer p-1">
                  {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </div>
              </div>

              {/* Revenue lines */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {lines.length === 0 && showAddLine !== cat.id && (
                    <div className="px-5 py-6 text-center">
                      <p className="text-xs text-gray-400 mb-2">No revenue lines in this category yet</p>
                      <button
                        onClick={() => setShowAddLine(cat.id)}
                        className="text-xs text-blue-600 font-medium hover:underline"
                      >
                        Add first revenue line
                      </button>
                    </div>
                  )}

                  {lines.map((line, i) => (
                    <div
                      key={line.id}
                      className={`flex items-center gap-3 px-5 py-3 hover:bg-blue-50/30 transition-colors group ${
                        i > 0 ? "border-t border-gray-50" : ""
                      }`}
                    >
                      <div className="w-6 flex justify-center">
                        <div className="w-px h-4 bg-gray-200" />
                      </div>
                      <Tag size={14} className="text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{line.name}</p>
                        {line.description && <p className="text-[10px] text-gray-400">{line.description}</p>}
                      </div>
                      <button
                        onClick={() => deleteLine(line.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {/* Inline add form */}
                  {showAddLine === cat.id ? (
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <input
                          value={newLineName}
                          onChange={e => setNewLineName(e.target.value)}
                          placeholder="Revenue line name"
                          autoFocus
                          onKeyDown={e => { if (e.key === "Enter") addRevenueLine(cat.id); if (e.key === "Escape") setShowAddLine(null); }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500"
                        />
                        <input
                          value={newLineDesc}
                          onChange={e => setNewLineDesc(e.target.value)}
                          placeholder="Description (optional)"
                          onKeyDown={e => { if (e.key === "Enter") addRevenueLine(cat.id); }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 hidden sm:block"
                        />
                        <button onClick={() => addRevenueLine(cat.id)} disabled={!newLineName.trim()} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40">Add</button>
                        <button onClick={() => { setShowAddLine(null); setNewLineName(""); setNewLineDesc(""); }} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-100">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-2 border-t border-gray-50">
                      <button
                        onClick={() => setShowAddLine(cat.id)}
                        className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Add revenue line
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Uncategorized lines */}
        {uncategorized.length > 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Uncategorized ({uncategorized.length})</p>
            <div className="space-y-2">
              {uncategorized.map(line => (
                <div key={line.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag size={12} className="text-gray-400" />
                  <span>{line.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddCategory(false)}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Add Revenue Category</h2>
              <button onClick={() => setShowAddCategory(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-medium text-gray-600 mb-1">Category Name</label>
              <input
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="e.g. Aeronautical, Commercial, Real Estate"
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") addCategory(); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-gray-400 mt-2">Categories group your revenue lines (e.g. Aeronautical, Non-Aeronautical, Commercial)</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowAddCategory(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={addCategory} disabled={!newCatName.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
