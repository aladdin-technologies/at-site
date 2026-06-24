"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { TopBar } from "@/components/platform/TopBar";
import { supabase, REVENUE_CATEGORY_COLORS, REVENUE_CATEGORY_LABELS } from "@/lib/supabase";
import { ArrowLeft, Plane, Calculator } from "lucide-react";
import { AnimatedNumber } from "@/components/platform/AnimatedNumber";
import { useCurrencyConverter } from "@/lib/useCurrency";

interface ChargeDetail {
  id: string;
  charge_name: string;
  charge_description: string | null;
  formula_type: string | null;
  formula_data: any;
  unit_basis: string | null;
  currency: string;
  base_rate: number | null;
  direction: string | null;
  passenger_type: string | null;
  source_url: string | null;
  source_document: string | null;
  notes: string | null;
}

interface AirportInfo {
  id: string;
  name: string;
  iata_code: string | null;
  icao_code: string;
  country_name: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
}

interface RevLine {
  name: string;
  slug: string;
  category: "aero" | "non_aero";
  description: string | null;
}

interface Aircraft {
  type_code: string;
  name: string;
  manufacturer: string;
  category: string;
  mtow_kg: number;
  mtow_tonnes: number;
  typical_pax: number;
  noise_chapter: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  wide_body: "Wide Body",
  narrow_body: "Narrow Body",
  regional: "Regional",
  private_jet: "Private Jet",
  freighter: "Freighter",
};

const CATEGORY_COLORS: Record<string, string> = {
  wide_body: "#22d3ee",
  narrow_body: "#3b82f6",
  regional: "#a78bfa",
  private_jet: "#f59e0b",
  freighter: "#34d399",
};

// === Driver detection and calculation engine ===

type ChargeDriver = "noise" | "dom_intl" | "tiered" | "simple" | "lookup";

const CHAPTER_TO_CAT: Record<number, string> = { 14: "A", 4: "C", 3: "E" };
const CHAPTER_LABELS: Record<number, string> = { 14: "Ch.14 (quietest)", 4: "Ch.4 (standard)", 3: "Ch.3 (older)" };

interface CalcResult {
  amount: number;
  rate: number;
  driver: ChargeDriver;
  driverLabel: string;
  formula: string;
}

function detectDriver(charge: ChargeDetail): ChargeDriver {
  const text = ((charge.charge_description || "") + " " + (charge.notes || "")).toLowerCase();
  if (/[a-f]=.*\/t/i.test(text) || text.includes("noise category") || charge.formula_type === "lookup") return "noise";
  if (/international.*domestic|domestic.*international/i.test(text)) return "dom_intl";
  if (charge.formula_type === "tiered") return "tiered";
  return "simple";
}

function parseDomIntlRates(charge: ChargeDetail): { intl: number; dom: number } | null {
  const text = (charge.charge_description || "") + " " + (charge.notes || "");
  const intlMatch = text.match(/international[:\s]*[\w]*\s*([\d,]+(?:\.\d+)?)/i);
  const domMatch = text.match(/domestic[:\s]*[\w]*\s*([\d,]+(?:\.\d+)?)/i);
  if (intlMatch && domMatch) {
    return { intl: parseFloat(intlMatch[1].replace(/,/g, "")), dom: parseFloat(domMatch[1].replace(/,/g, "")) };
  }
  return null;
}

function parseNoiseRates(charge: ChargeDetail): Record<string, number> | null {
  const text = (charge.charge_description || "") + " " + (charge.notes || "");
  const matches = [...text.matchAll(/([A-F])=\w*\s*([\d,]+(?:\.\d+)?)\/?t/gi)];
  if (matches.length >= 2) {
    const map: Record<string, number> = {};
    for (const m of matches) map[m[1].toUpperCase()] = parseFloat(m[2].replace(/,/g, ""));
    return map;
  }
  return null;
}

function calcAmount(rate: number, mtowTonnes: number, unitBasis: string): number {
  if (unitBasis === "mtow_kg") return rate * mtowTonnes * 1000;
  if (unitBasis === "mtow_klbs") return rate * (mtowTonnes * 2.20462);
  return rate * mtowTonnes;
}

function calculateCharge(charge: ChargeDetail, mtowTonnes: number, ac: Aircraft, flightType: "international" | "domestic"): CalcResult | null {
  const driver = detectDriver(charge);
  const basis = charge.unit_basis || "mtow_tonnes";
  const basisLabel = basis === "mtow_klbs" ? "klbs" : basis === "mtow_kg" ? "kg" : "t";
  const mtowDisplay = basis === "mtow_klbs" ? (mtowTonnes * 2.20462).toFixed(1) : basis === "mtow_kg" ? (mtowTonnes * 1000).toFixed(0) : mtowTonnes.toFixed(1);

  if (driver === "noise") {
    const noiseRates = parseNoiseRates(charge);
    if (noiseRates) {
      const cat = CHAPTER_TO_CAT[ac.noise_chapter] || "C";
      const rate = noiseRates[cat] ?? noiseRates["C"] ?? charge.base_rate ?? 0;
      const amount = calcAmount(rate, mtowTonnes, basis);
      return { amount, rate, driver, driverLabel: `Noise Cat ${cat}`, formula: `${mtowDisplay}${basisLabel} × ${rate.toLocaleString()} (Cat ${cat})` };
    }
  }

  if (driver === "dom_intl") {
    const rates = parseDomIntlRates(charge);
    if (rates) {
      const rate = flightType === "domestic" ? rates.dom : rates.intl;
      const amount = calcAmount(rate, mtowTonnes, basis);
      return { amount, rate, driver, driverLabel: flightType === "domestic" ? "Domestic" : "International", formula: `${mtowDisplay}${basisLabel} × ${rate.toLocaleString()} (${flightType})` };
    }
  }

  const rate = charge.base_rate;
  if (!rate) return null;
  const amount = calcAmount(rate, mtowTonnes, basis);
  return { amount, rate, driver, driverLabel: driver === "tiered" ? "Base tier" : "Standard", formula: `${mtowDisplay}${basisLabel} × ${rate.toLocaleString()}` };
}

function formatCurrency(amount: number, currency: string): string {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency;
}

const NOISE_ORDER = ["ultra_low", "super_low", "low", "base", "high", "super_high", "ultra_high", "maximum", "helicopter"];
const NOISE_LABELS: Record<string, string> = {
  ultra_low: "Ultra Low", super_low: "Super Low", low: "Low", base: "Base",
  high: "High", super_high: "Super High", ultra_high: "Ultra High",
  maximum: "Maximum", helicopter: "Helicopter",
};
const NOISE_COLORS: Record<string, string> = {
  ultra_low: "#34d399", super_low: "#34d399", low: "#22d3ee", base: "#3b82f6",
  high: "#f59e0b", super_high: "#f59e0b", ultra_high: "#f87171", maximum: "#f87171", helicopter: "#a78bfa",
};

function NoiseAircraftSimulation({ charge, aircraft }: { charge: ChargeDetail; aircraft: Aircraft[] }) {
  const { convert } = useCurrencyConverter();
  const fd = charge.formula_data as any;
  const table = fd?.table;
  if (!table) return null;

  const catForChapter: Record<number, string> = { 14: "ultra_low", 4: "base", 3: "high" };

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Calculator size={20} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Aircraft Charge Simulation</h2>
          <p className="text-[12px] text-slate-500">Estimated charge per movement based on aircraft noise classification</p>
        </div>
      </div>

      {["wide_body", "narrow_body", "regional", "private_jet", "freighter"].map((cat) => {
        const catAircraft = aircraft.filter((a) => a.category === cat);
        if (!catAircraft.length) return null;
        return (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                {CATEGORY_LABELS[cat]}
              </span>
            </div>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-wider uppercase text-slate-500">Aircraft</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-semibold tracking-wider uppercase text-slate-500">Charge per movement</th>
                  </tr>
                </thead>
                <tbody>
                  {catAircraft.map((ac) => {
                    const noiseCat = catForChapter[ac.noise_chapter] || "base";
                    const noiseCatLabel = NOISE_LABELS[noiseCat] || noiseCat;
                    const rate = (table[noiseCat] as number) ?? (table["base"] as number) ?? 0;
                    const converted = convert(rate, charge.currency);
                    const noiseColor = NOISE_COLORS[noiseCat] || "#3b82f6";

                    return (
                      <tr key={ac.type_code} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold" style={{ color: CATEGORY_COLORS[cat] }}>
                            {ac.type_code}
                          </span>
                          <span className="text-slate-500 text-[11px] ml-2 truncate">{ac.name}</span>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] text-slate-600 font-mono">MTOW: {ac.mtow_tonnes.toFixed(1)}t</span>
                            <span className="text-[10px] text-slate-700">ICAO {CHAPTER_LABELS[ac.noise_chapter] || `Ch.${ac.noise_chapter}`}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: noiseColor + "18", color: noiseColor }}>
                              {noiseCatLabel}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <AnimatedNumber value={converted.value} className="font-mono font-bold text-white" />
                          <span className="text-cyan-400/70 text-[10px] ml-1 font-semibold">{converted.currency}</span>
                          <span className="block text-[10px] text-slate-600 font-mono mt-1">
                            Fixed fee ({noiseCatLabel} category)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <p className="text-[10px] text-slate-600 mt-4">
        Heathrow charges a fixed fee per movement based on noise category — not per MTOW tonne. Quieter aircraft (ICAO Chapter 14) pay significantly less than noisier ones.
      </p>
    </div>
  );
}

function NoiseCategoryTable({ charge }: { charge: ChargeDetail }) {
  const { convert } = useCurrencyConverter();
  const fd = charge.formula_data as any;
  const table = fd?.table;
  if (!table) return null;

  const entries = NOISE_ORDER.filter((k) => table[k] != null).map((k) => ({
    key: k,
    label: NOISE_LABELS[k] || k,
    rate: table[k] as number,
    color: NOISE_COLORS[k] || "#3b82f6",
  }));

  const maxRate = Math.max(...entries.map((e) => e.rate));

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Calculator size={20} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Noise Category Rate Card</h2>
          <p className="text-[12px] text-slate-500">Fixed charge per movement — rate depends on aircraft noise classification</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-[10px] font-semibold tracking-wider uppercase text-slate-500">Category</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold tracking-wider uppercase text-slate-500">Rate per movement</th>
              <th className="px-4 py-3 hidden sm:table-cell"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const converted = convert(e.rate, charge.currency);
              const barWidth = Math.max((e.rate / maxRate) * 100, 2);
              return (
                <tr key={e.key} className="border-b border-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                      <span className="text-white font-medium">{e.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AnimatedNumber value={converted.value} className="font-mono font-bold text-white" />
                    <span className="text-cyan-400/70 text-[10px] ml-1 font-semibold">{converted.currency}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell w-40">
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%`, backgroundColor: e.color }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-slate-600 mt-3">
        Categories based on cumulative EPNdB margin below ICAO Chapter 3 limits. Each movement (landing + departure) incurs this charge.
      </p>
    </div>
  );
}

export default function ChargeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const airportId = params.airportId as string;

  const [authorized, setAuthorized] = useState(false);
  const [airport, setAirport] = useState<AirportInfo | null>(null);
  const [revLine, setRevLine] = useState<RevLine | null>(null);
  const [charges, setCharges] = useState<ChargeDetail[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [flightType, setFlightType] = useState<"international" | "domestic">("international");

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/platform/DAdemo/enterprise-access/portal/verify");
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    async function load() {
      const [apRes, rlRes, acRes] = await Promise.all([
        supabase.from("airports").select("id,name,iata_code,icao_code,country_name,city,latitude,longitude").eq("id", airportId).single(),
        supabase.from("revenue_lines").select("name,slug,category,description").eq("slug", slug).single(),
        supabase.from("simulation_aircraft").select("*").order("sort_order"),
      ]);
      setAirport(apRes.data);
      setRevLine(rlRes.data);
      setAircraft(acRes.data ?? []);

      if (rlRes.data) {
        const { data: ch } = await supabase
          .from("airport_charges")
          .select("id,charge_name,charge_description,formula_type,formula_data,unit_basis,currency,base_rate,direction,passenger_type,source_url,source_document,notes")
          .eq("airport_id", airportId)
          .eq("revenue_line_id", rlRes.data ? (await supabase.from("revenue_lines").select("id").eq("slug", slug).single()).data?.id : "")
          .eq("year", 2026);
        setCharges(ch ?? []);
      }
      setLoading(false);
    }
    load();
  }, [authorized, airportId, slug]);

  const chargeDriver = useMemo(() => {
    if (!charges.length) return "simple" as ChargeDriver;
    return detectDriver(charges[0]);
  }, [charges]);

  const simulations = useMemo(() => {
    if (!charges.length || !aircraft.length) return [];
    const primary = charges[0];
    return aircraft.map((ac) => {
      const result = calculateCharge(primary, ac.mtow_tonnes, ac, flightType);
      return { aircraft: ac, result, currency: primary.currency };
    });
  }, [charges, aircraft, flightType]);

  if (!authorized) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a14] text-white">
        <TopBar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!airport || !revLine) {
    return (
      <div className="min-h-screen bg-[#060a14] text-white">
        <TopBar />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-slate-400">Data not found</p>
          <button onClick={() => router.back()} className="text-cyan-400 hover:underline text-sm">Back</button>
        </div>
      </div>
    );
  }

  const color = REVENUE_CATEGORY_COLORS[revLine.category];
  const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${airport.latitude},${airport.longitude}&zoom=14&maptype=satellite`;

  // Extract confidence from notes
  const confidenceMatch = charges[0]?.notes?.match(/\[confidence:\s*(\w+)\]/i);
  const confidenceLevel = confidenceMatch?.[1] || (charges[0]?.source_url?.includes("aip") || charges[0]?.source_document?.toLowerCase().includes("aip") ? "high" : "medium");
  const confidencePct = confidenceLevel === "high" ? 95 : confidenceLevel === "medium" ? 70 : 45;
  const isAipSource = charges[0]?.source_url?.includes("aip") || charges[0]?.source_document?.toLowerCase().includes("aip") || charges[0]?.notes?.toLowerCase().includes("aip");
  const confidenceColor = confidencePct >= 90 ? "#34d399" : confidencePct >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div className="min-h-screen bg-[#060a14] text-white">
      <TopBar />

      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Map visual */}
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden mb-6">
          <iframe
            src={mapsEmbedUrl}
            width="100%"
            height="220"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full" style={{ backgroundColor: color + "15", color }}>
              {REVENUE_CATEGORY_LABELS[revLine.category]}
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full" style={{ backgroundColor: confidenceColor + "15", color: confidenceColor }}>
              {confidencePct}% confidence {isAipSource ? "(AIP verified)" : "(non-AIP source)"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">
            {airport.name} <span className="font-mono text-cyan-400">({airport.iata_code})</span>
          </h1>
          <p className="text-sm text-slate-500">{airport.city && `${airport.city}, `}{airport.country_name}</p>
        </div>

        {/* Charge details */}
        {charges.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center mb-10">
            <p className="text-slate-500">No detailed charge data available for this airport.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {charges.map((c) => (
              <div key={c.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white mb-1">{revLine.name}</h2>
                    <p className="text-[11px] text-slate-600 mb-1">{c.charge_name}</p>
                    {c.charge_description && (
                      <p className="text-[12px] text-slate-500 leading-relaxed max-w-2xl">{c.charge_description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-mono font-bold text-xl text-white">
                      {c.base_rate != null ? c.base_rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                      <span className="text-cyan-400/70 text-sm ml-1">{c.currency}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">{c.unit_basis?.replace(/_/g, " ") || c.formula_type || "—"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/[0.03] p-3">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Charge type</p>
                    <p className="text-sm text-white">{c.formula_type?.replace(/_/g, " ") || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] p-3">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Basis</p>
                    <p className="text-sm text-white">{c.unit_basis?.replace(/_/g, " ") || "—"}</p>
                  </div>
                </div>
                {c.source_url && (
                  <a href={c.source_url} target="_blank" rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:underline">
                    Source: {c.source_document || "View document"} ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Noise category rate table — for lookup-type charges like LHR */}
        {charges.length > 0 && charges[0].formula_type === "lookup" && charges[0].formula_data && (
          <NoiseCategoryTable charge={charges[0]} />
        )}

        {/* Noise-based aircraft simulation — for lookup charges like LHR */}
        {charges.length > 0 && charges[0].formula_type === "lookup" && charges[0].formula_data && aircraft.length > 0 && (
          <NoiseAircraftSimulation charge={charges[0]} aircraft={aircraft} />
        )}

        {/* MTOW-based Simulations */}
        {simulations.length > 0 && charges[0]?.formula_type !== "lookup" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Calculator size={20} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Landing Charge Simulation</h2>
                  <p className="text-[12px] text-slate-500">
                    Driver: {chargeDriver === "noise" ? "MTOW × Noise Category" : chargeDriver === "dom_intl" ? "MTOW × Flight Type (Domestic / International)" : chargeDriver === "tiered" ? "MTOW Tiered Brackets" : "MTOW × Rate per Tonne"}
                  </p>
                </div>
              </div>
              {chargeDriver === "dom_intl" && (
                <div className="flex gap-2">
                  {(["international", "domestic"] as const).map((ft) => (
                    <button
                      key={ft}
                      onClick={() => setFlightType(ft)}
                      className={`px-4 py-2 rounded-lg text-[12px] font-semibold capitalize transition-all ${
                        flightType === ft
                          ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                          : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.05]"
                      }`}
                    >
                      {ft}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Group by category */}
            {["wide_body", "narrow_body", "regional", "private_jet", "freighter"].map((cat) => {
              const catSims = simulations.filter((s) => s.aircraft.category === cat);
              if (!catSims.length) return null;
              return (
                <div key={cat} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-wider uppercase text-slate-500">Aircraft</th>
                          <th className="text-right px-4 py-2.5 text-[10px] font-semibold tracking-wider uppercase text-slate-500">Est. charge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catSims.map((s) => {
                          const mtow = s.aircraft.mtow_tonnes;
                          return (
                            <tr key={s.aircraft.type_code} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                              <td className="px-4 py-3">
                                <span className="font-mono font-bold" style={{ color: CATEGORY_COLORS[cat] }}>
                                  {s.aircraft.type_code}
                                </span>
                                <span className="text-slate-500 text-[11px] ml-2">{s.aircraft.name}</span>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <span className="text-[11px] text-slate-600 font-mono">
                                    MTOW: {mtow.toFixed(1)}t
                                  </span>
                                  {chargeDriver === "noise" && (
                                    <>
                                      <span className="text-[10px] text-slate-700">
                                        ICAO {CHAPTER_LABELS[s.aircraft.noise_chapter] || `Ch.${s.aircraft.noise_chapter}`}
                                      </span>
                                      {s.result?.driverLabel && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold">
                                          {s.result.driverLabel}
                                        </span>
                                      )}
                                    </>
                                  )}
                                  {chargeDriver === "dom_intl" && s.result?.driverLabel && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold">
                                      {s.result.driverLabel}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-mono font-bold text-white">
                                  {s.result != null ? formatCurrency(s.result.amount, s.currency) : "—"}
                                </span>
                                <span className="block text-[10px] text-slate-600 font-mono mt-1">
                                  {s.result?.formula || "—"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            <p className="text-[10px] text-slate-600 mt-4">
              Estimates based on published base rate × MTOW. Actual charges may vary due to noise surcharges, time-of-day factors, tiered brackets, and minimum charges.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
