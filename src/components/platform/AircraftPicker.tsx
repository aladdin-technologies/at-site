"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check, Plane } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Aircraft {
  type_code: string;
  name: string;
  manufacturer: string;
  category: string;
  mtow_kg: number;
  mtow_tonnes: number;
  typical_pax: number;
  noise_chapter: number;
  noise_category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  wide_body: "Wide Body",
  narrow_body: "Narrow Body",
  regional: "Regional",
  private_jet: "Private Jet",
  freighter: "Freighter",
};

let cachedAircraft: Aircraft[] | null = null;

const listeners = new Set<(a: Aircraft | null) => void>();
let globalAircraft: Aircraft | null = null;

export function getSelectedAircraft() { return globalAircraft; }

export function setSelectedAircraft(a: Aircraft | null) {
  globalAircraft = a;
  listeners.forEach((fn) => fn(a));
}

export function useSelectedAircraft() {
  const [aircraft, setAircraft] = useState<Aircraft | null>(globalAircraft);
  useEffect(() => {
    listeners.add(setAircraft);
    return () => { listeners.delete(setAircraft); };
  }, []);
  return aircraft;
}

export function AircraftPicker() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [aircraftList, setAircraftList] = useState<Aircraft[]>(cachedAircraft ?? []);
  const selected = useSelectedAircraft();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cachedAircraft) { setAircraftList(cachedAircraft); return; }
    supabase.from("simulation_aircraft").select("*").order("sort_order").then(({ data }) => {
      if (data) { cachedAircraft = data as Aircraft[]; setAircraftList(data as Aircraft[]); }
    });
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return aircraftList;
    const q = search.toLowerCase();
    return aircraftList.filter((a) =>
      a.type_code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.manufacturer.toLowerCase().includes(q),
    );
  }, [aircraftList, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Aircraft[]> = {};
    for (const a of filtered) {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    }
    return groups;
  }, [filtered]);

  const label = selected ? selected.type_code : "All";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); setSearch(""); }}
        className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${selected ? "bg-cyan-500/15 border-cyan-500/25" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]"}`}
        title={selected ? `${selected.type_code} — ${selected.name}` : "Select aircraft"}
      >
        <Plane size={16} className={selected ? "text-cyan-400" : "text-slate-400"} />
      </button>

      {open && (
        <>
        <div className="fixed inset-0 z-[79] bg-black/40" onClick={() => setOpen(false)} />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm max-h-[70vh] rounded-xl border border-white/[0.08] bg-[#0a0f1e] shadow-2xl z-[80] overflow-hidden">
          <div className="p-2 border-b border-white/[0.06]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="Search aircraft..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/30"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
            {/* None option */}
            <button
              onClick={() => { setSelectedAircraft(null); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${!selected ? "bg-cyan-500/10" : "hover:bg-white/[0.04]"}`}
            >
              <span className="w-5 h-4 rounded-sm bg-white/[0.06] flex items-center justify-center text-[9px] text-slate-500">—</span>
              <span className="text-sm text-slate-300 flex-1">No aircraft selected</span>
              <span className="text-[10px] text-slate-600">Per-unit rates</span>
              {!selected && <Check size={14} className="text-cyan-400 shrink-0" />}
            </button>

            {/* Grouped by category */}
            {["wide_body", "narrow_body", "regional", "private_jet", "freighter"].map((cat) => {
              const items = grouped[cat];
              if (!items?.length) return null;
              return (
                <div key={cat}>
                  <div className="px-3 py-1.5 text-[9px] font-semibold tracking-wider uppercase text-slate-600 bg-white/[0.02]">
                    {CATEGORY_LABELS[cat]}
                  </div>
                  {items.map((a) => {
                    const isSelected = selected?.type_code === a.type_code;
                    return (
                      <button
                        key={a.type_code}
                        onClick={() => { setSelectedAircraft(a); setOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${isSelected ? "bg-cyan-500/10" : "hover:bg-white/[0.04]"}`}
                      >
                        <span className="font-mono text-sm font-bold text-cyan-400 w-16 shrink-0">{a.type_code}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] text-slate-300 truncate block">{a.name}</span>
                          <span className="text-[10px] text-slate-600">{a.mtow_tonnes.toFixed(1)}t MTOW</span>
                        </div>
                        {isSelected && <Check size={14} className="text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
