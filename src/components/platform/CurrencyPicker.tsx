"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check } from "lucide-react";
import {
  useDisplayCurrency,
  setDisplayCurrency,
  useExchangeRates,
} from "@/lib/useCurrency";

const MAJORS = ["USD", "EUR", "GBP", "AED", "INR", "SAR", "AUD", "CAD", "SGD", "JPY", "CNY", "CHF", "HKD", "KRW", "THB", "MYR", "SEK", "NOK", "DKK", "NZD", "TRY", "ZAR", "BRL", "MXN"];

const CURRENCY_COUNTRY: Record<string, string | null> = {
  EUR: "eu", XAF: null, XOF: null, XPF: null, XCD: null, XDR: null, XCG: null, ANG: null, XAU: null, XAG: null, XPT: null, XPD: null,
};

function currencyCountry(code: string): string | null {
  const up = code.toUpperCase();
  if (up in CURRENCY_COUNTRY) return CURRENCY_COUNTRY[up];
  return up.slice(0, 2).toLowerCase();
}

let _displayNames: Intl.DisplayNames | null | undefined;
function getDisplayNames(): Intl.DisplayNames | null {
  if (_displayNames !== undefined) return _displayNames;
  try { _displayNames = new Intl.DisplayNames(["en"], { type: "currency" }); }
  catch { _displayNames = null; }
  return _displayNames;
}

function currencyName(code: string): string {
  if (code === "AUTO") return "Auto (local currency)";
  try {
    const n = getDisplayNames()?.of(code.toUpperCase());
    if (n && n.toUpperCase() !== code.toUpperCase()) return n;
  } catch {}
  return code;
}

function FlagImg({ code }: { code: string }) {
  const country = currencyCountry(code);
  if (!country) return <span className="w-5 h-4 rounded-sm bg-white/[0.06] flex items-center justify-center text-[8px] text-slate-600">$</span>;
  return (
    <img
      src={`https://flagcdn.com/w40/${country}.png`}
      alt={country}
      width={20}
      height={15}
      className="w-5 h-[15px] rounded-sm object-cover"
    />
  );
}

function PickerModal({ onClose, onSelect, selected }: { onClose: () => void; onSelect: (code: string) => void; selected: string }) {
  const rates = useExchangeRates();
  const [search, setSearch] = useState("");

  const allCodes = Object.keys(rates).sort();
  const majorSet = new Set(MAJORS);
  const ordered = ["AUTO", ...MAJORS.filter((c) => rates[c]), ...allCodes.filter((c) => !majorSet.has(c))];

  const filtered = search
    ? ordered.filter((c) => {
        const q = search.toLowerCase();
        return c.toLowerCase().includes(q) || currencyName(c).toLowerCase().includes(q);
      })
    : ordered;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 99998, background: "rgba(0,0,0,0.5)" }} onMouseDown={onClose} onTouchEnd={onClose} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 99999, width: "90vw", maxWidth: 380, maxHeight: "70vh", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "#0a0f1e", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
            <input
              type="text"
              placeholder={`Search ${allCodes.length}+ currencies`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 14, color: "white", outline: "none" }}
            />
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {filtered.map((code) => {
            const isSelected = code === selected;
            return (
              <button
                key={code}
                onMouseDown={(e) => { e.stopPropagation(); onSelect(code); }}
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onSelect(code); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", textAlign: "left", background: isSelected ? "rgba(34,211,238,0.1)" : "transparent", border: "none", cursor: "pointer", color: "white" }}
              >
                {code === "AUTO" ? (
                  <span style={{ width: 20, height: 16, borderRadius: 2, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#64748b" }}>A</span>
                ) : (
                  <FlagImg code={code} />
                )}
                <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, width: 40 }}>
                  {code === "AUTO" ? "—" : code}
                </span>
                <span style={{ fontSize: 14, color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currencyName(code)}
                </span>
                {isSelected && <Check size={14} style={{ color: "#22d3ee", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function CurrencyPicker() {
  const displayCurrency = useDisplayCurrency();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const label = displayCurrency === "AUTO" ? "Auto" : displayCurrency;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
      >
        {displayCurrency !== "AUTO" && <FlagImg code={displayCurrency} />}
        <span className="text-[11px] font-mono text-slate-300">{label}</span>
        <ChevronDown size={12} className="text-slate-500" />
      </button>

      {open && mounted && createPortal(
        <PickerModal
          selected={displayCurrency}
          onClose={() => setOpen(false)}
          onSelect={(code) => { setDisplayCurrency(code); setOpen(false); }}
        />,
        document.body
      )}
    </div>
  );
}
