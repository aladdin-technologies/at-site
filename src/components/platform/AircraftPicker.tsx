"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, Check, Plane } from "lucide-react";
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

function PickerModal({ onClose, onSelect, selected }: { onClose: () => void; onSelect: (a: Aircraft | null) => void; selected: Aircraft | null }) {
  const [search, setSearch] = useState("");
  const [aircraftList, setAircraftList] = useState<Aircraft[]>(cachedAircraft ?? []);

  useEffect(() => {
    if (cachedAircraft) { setAircraftList(cachedAircraft); return; }
    supabase.from("simulation_aircraft").select("*").order("sort_order").then(({ data }) => {
      if (data) { cachedAircraft = data as Aircraft[]; setAircraftList(data as Aircraft[]); }
    });
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

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 99998, background: "rgba(0,0,0,0.5)" }} onMouseDown={onClose} onTouchEnd={onClose} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 99999, width: "90vw", maxWidth: 380, maxHeight: "70vh", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "#0a0f1e", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
            <input
              type="text"
              placeholder="Search aircraft..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 14, color: "white", outline: "none" }}
            />
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* None option */}
          <button
            onMouseDown={(e) => { e.stopPropagation(); onSelect(null); }}
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onSelect(null); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", textAlign: "left", background: !selected ? "rgba(34,211,238,0.1)" : "transparent", border: "none", cursor: "pointer", color: "white" }}
          >
            <span style={{ width: 20, height: 16, borderRadius: 2, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#64748b" }}>—</span>
            <span style={{ fontSize: 14, color: "#cbd5e1", flex: 1 }}>No aircraft selected</span>
            <span style={{ fontSize: 10, color: "#475569" }}>Per-unit rates</span>
            {!selected && <Check size={14} style={{ color: "#22d3ee", flexShrink: 0 }} />}
          </button>

          {["wide_body", "narrow_body", "regional", "private_jet", "freighter"].map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <div key={cat}>
                <div style={{ padding: "6px 12px", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", background: "rgba(255,255,255,0.02)" }}>
                  {CATEGORY_LABELS[cat]}
                </div>
                {items.map((a) => {
                  const isSelected = selected?.type_code === a.type_code;
                  return (
                    <button
                      key={a.type_code}
                      onMouseDown={(e) => { e.stopPropagation(); onSelect(a); }}
                      onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onSelect(a); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", textAlign: "left", background: isSelected ? "rgba(34,211,238,0.1)" : "transparent", border: "none", cursor: "pointer", color: "white" }}
                    >
                      <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#22d3ee", width: 64, flexShrink: 0 }}>{a.type_code}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 12, color: "#cbd5e1", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                        <span style={{ fontSize: 10, color: "#475569" }}>{a.mtow_tonnes.toFixed(1)}t MTOW</span>
                      </div>
                      {isSelected && <Check size={14} style={{ color: "#22d3ee", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function AircraftPicker() {
  const [open, setOpen] = useState(false);
  const selected = useSelectedAircraft();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${selected ? "bg-cyan-500/15 border-cyan-500/25" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]"}`}
        title={selected ? `${selected.type_code} — ${selected.name}` : "Select aircraft"}
      >
        <Plane size={16} className={selected ? "text-cyan-400" : "text-slate-400"} />
      </button>

      {open && mounted && createPortal(
        <PickerModal
          selected={selected}
          onClose={() => setOpen(false)}
          onSelect={(a) => { setSelectedAircraft(a); setOpen(false); }}
        />,
        document.body
      )}
    </div>
  );
}
