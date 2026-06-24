"use client";

import { useState, useRef, useEffect } from "react";
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

export function CurrencyPicker() {
  const displayCurrency = useDisplayCurrency();
  const rates = useExchangeRates();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allCodes = Object.keys(rates).sort();
  const majorSet = new Set(MAJORS);
  const ordered = ["AUTO", ...MAJORS.filter((c) => rates[c]), ...allCodes.filter((c) => !majorSet.has(c))];

  const filtered = search
    ? ordered.filter((c) => {
        const q = search.toLowerCase();
        return c.toLowerCase().includes(q) || currencyName(c).toLowerCase().includes(q);
      })
    : ordered;

  const label = displayCurrency === "AUTO" ? "Auto" : displayCurrency;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
      >
        {displayCurrency !== "AUTO" && <FlagImg code={displayCurrency} />}
        <span className="text-[11px] font-mono text-slate-300">{label}</span>
        <ChevronDown size={12} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
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
                placeholder={`Search ${allCodes.length}+ currencies`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/30"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
            {filtered.map((code) => {
              const isSelected = code === displayCurrency;
              return (
                <button
                  key={code}
                  onClick={() => {
                    setDisplayCurrency(code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-cyan-500/10" : "hover:bg-white/[0.04]"
                  }`}
                >
                  {code === "AUTO" ? (
                    <span className="w-5 h-4 rounded-sm bg-white/[0.06] flex items-center justify-center text-[9px] text-slate-500">A</span>
                  ) : (
                    <FlagImg code={code} />
                  )}
                  <span className="font-mono text-sm font-semibold text-white w-10">
                    {code === "AUTO" ? "—" : code}
                  </span>
                  <span className="text-sm text-slate-400 flex-1 truncate">
                    {currencyName(code)}
                  </span>
                  {isSelected && <Check size={14} className="text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
