"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { TopBar } from "@/components/platform/TopBar";
import {
  supabase,
  REVENUE_CATEGORY_COLORS,
  REVENUE_CATEGORY_LABELS,
  type RevenueLineRow,
} from "@/lib/supabase";
import { ArrowLeft, Search, ChevronRight } from "lucide-react";
import { useCurrencyConverter } from "@/lib/useCurrency";
import { AnimatedNumber } from "@/components/platform/AnimatedNumber";
import { useSelectedAircraft } from "@/components/platform/AircraftPicker";

interface ChargeRow {
  id: string;
  airport_id: string;
  charge_name: string;
  formula_type: string | null;
  unit_basis: string | null;
  currency: string;
  base_rate: number | null;
  direction: string | null;
  passenger_type: string | null;
  airports: {
    id: string;
    name: string;
    iata_code: string | null;
    country: string;
    country_name: string | null;
    city: string | null;
  };
}

type SortKey = "name" | "rate_asc" | "rate_desc" | "country";

const UNIT_LABELS: Record<string, string> = {
  mtow_tonnes: "per MTOW tonne",
  mtow_kg: "per MTOW kg",
  mtow_klbs: "per 1,000 lbs MTOW",
  per_passenger: "per passenger",
  per_movement: "per movement",
  per_hour: "per hour",
  per_15min: "per 15 minutes",
  per_day: "per day",
  nox_per_lto_kg: "per kg NOx/LTO",
  co2_per_lto_kg: "per kg CO2/LTO",
  departing_bags: "per departing bag",
  flat: "flat fee per occurrence",
};

function formatUnit(unitBasis: string | null, formulaType: string | null): string {
  if (unitBasis && UNIT_LABELS[unitBasis]) return UNIT_LABELS[unitBasis];
  if (unitBasis) return unitBasis.replace(/_/g, " ");
  if (formulaType === "flat") return "flat fee";
  if (formulaType === "per_pax") return "per passenger";
  if (formulaType === "per_unit") return "per unit";
  if (formulaType === "time_based") return "time-based";
  return "—";
}

export default function RateCardPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [authorized, setAuthorized] = useState(false);
  const [revLine, setRevLine] = useState<RevenueLineRow | null>(null);
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("rate_desc");
  const { displayCurrency, convert } = useCurrencyConverter();
  const selectedAircraft = useSelectedAircraft();

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/platform/DAdemo/enterprise-access/portal/verify");
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized || !slug) return;
    async function load() {
      const { data: rl } = await supabase
        .from("revenue_lines")
        .select("*")
        .eq("slug", slug)
        .single();
      setRevLine(rl);

      if (rl) {
        const { data: ch } = await supabase
          .from("airport_charges")
          .select("id,airport_id,charge_name,formula_type,unit_basis,currency,base_rate,direction,passenger_type,airports(id,name,iata_code,country,country_name,city)")
          .eq("revenue_line_id", rl.id)
          .eq("year", 2026)
          .order("base_rate", { ascending: false });
        setCharges((ch ?? []) as unknown as ChargeRow[]);
      }
      setLoading(false);
    }
    load();
  }, [authorized, slug]);

  const filtered = useMemo(() => {
    let list = charges;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.airports.name.toLowerCase().includes(q) ||
          (c.airports.iata_code && c.airports.iata_code.toLowerCase().includes(q)) ||
          (c.airports.country_name && c.airports.country_name.toLowerCase().includes(q)) ||
          c.airports.country.toLowerCase().includes(q) ||
          (c.charge_name && c.charge_name.toLowerCase().includes(q)),
      );
    }
    // Pin ICN, NRT at top and LHR at bottom
    const pinTop = ["ICN", "NRT"];
    const pinBottom = ["LHR"];
    const top = list.filter((c) => pinTop.includes(c.airports.iata_code || ""));
    const bottom = list.filter((c) => pinBottom.includes(c.airports.iata_code || ""));
    const rest = list.filter((c) => !pinTop.includes(c.airports.iata_code || "") && !pinBottom.includes(c.airports.iata_code || ""));

    const sorted = [...rest];
    switch (sort) {
      case "rate_desc":
        sorted.sort((a, b) => (b.base_rate ?? 0) - (a.base_rate ?? 0));
        break;
      case "rate_asc":
        sorted.sort((a, b) => (a.base_rate ?? 0) - (b.base_rate ?? 0));
        break;
      case "name":
        sorted.sort((a, b) => a.airports.name.localeCompare(b.airports.name));
        break;
      case "country":
        sorted.sort((a, b) =>
          (a.airports.country_name ?? a.airports.country).localeCompare(
            b.airports.country_name ?? b.airports.country,
          ),
        );
        break;
    }
    // Pin order: ICN, NRT first → rest sorted → LHR last
    top.sort((a, b) => pinTop.indexOf(a.airports.iata_code || "") - pinTop.indexOf(b.airports.iata_code || ""));
    return [...top, ...sorted, ...bottom];
  }, [charges, search, sort]);

  const uniqueAirports = useMemo(
    () => new Set(charges.map((c) => c.airport_id)).size,
    [charges],
  );

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

  if (!revLine) {
    return (
      <div className="min-h-screen bg-[#060a14] text-white">
        <TopBar />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-slate-400">Revenue line not found</p>
          <button
            onClick={() =>
              router.push("/platform/DAdemo/enterprise-access/portal/revenue")
            }
            className="text-cyan-400 hover:underline text-sm"
          >
            Back to Revenue Intelligence
          </button>
        </div>
      </div>
    );
  }

  const color = REVENUE_CATEGORY_COLORS[revLine.category];

  return (
    <div className="min-h-screen bg-[#060a14] text-white">
      <TopBar />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{revLine.name}</h1>
              <span
                className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: color + "15",
                  color,
                }}
              >
                {REVENUE_CATEGORY_LABELS[revLine.category]}
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-2xl">
              {revLine.description}
            </p>
          </div>
        </div>


        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Search by airport, IATA code or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
            <p className="text-slate-500 text-sm">
              No charge data available for this revenue line yet.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div>
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                      Airport
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500 hidden md:table-cell">
                      Country
                    </th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() =>
                        router.push(
                          `/platform/DAdemo/enterprise-access/portal/revenue/${slug}/${c.airports.id}`,
                        )
                      }
                      className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-lg text-cyan-400 group-hover:text-cyan-300 transition-colors">
                          {c.airports.iata_code || "—"}
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight truncate">
                          {c.airports.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm hidden md:table-cell">
                        {c.airports.country_name || c.airports.country}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(() => {
                          if (c.base_rate == null) return <span className="text-slate-500">—</span>;

                          // If aircraft selected, compute actual charge
                          let displayRate = c.base_rate;
                          let unitLabel = formatUnit(c.unit_basis, c.formula_type);
                          let aircraftNote = "";

                          if (selectedAircraft) {
                            const basis = c.unit_basis || "";
                            if (basis === "mtow_klbs") {
                              displayRate = c.base_rate * (selectedAircraft.mtow_tonnes * 2.20462);
                              aircraftNote = `${selectedAircraft.type_code} (${(selectedAircraft.mtow_tonnes * 2.20462).toFixed(0)} klbs)`;
                            } else if (basis === "mtow_kg") {
                              displayRate = c.base_rate * selectedAircraft.mtow_kg;
                              aircraftNote = `${selectedAircraft.type_code} (${selectedAircraft.mtow_kg.toLocaleString()} kg)`;
                            } else if (basis.includes("tonne") || basis.includes("mtow") || c.formula_type === "per_unit") {
                              displayRate = c.base_rate * selectedAircraft.mtow_tonnes;
                              aircraftNote = `${selectedAircraft.type_code} (${selectedAircraft.mtow_tonnes.toFixed(1)}t)`;
                            } else if (basis === "per_movement" || c.formula_type === "lookup") {
                              displayRate = c.base_rate;
                              aircraftNote = `${selectedAircraft.type_code} (fixed per movement)`;
                            }
                            unitLabel = selectedAircraft ? "per landing" : unitLabel;
                          }

                          const converted = convert(displayRate, c.currency);
                          return (
                            <>
                              <AnimatedNumber value={converted.value} className="font-mono font-bold text-white" />
                              <span className="text-cyan-400/70 text-[10px] ml-1 font-semibold">
                                {converted.currency}
                              </span>
                              <span className="block text-[10px] text-slate-500 mt-0.5">
                                {unitLabel}
                              </span>
                              {aircraftNote && (
                                <span className="block text-[9px] text-amber-400/60 mt-0.5">
                                  {aircraftNote}
                                </span>
                              )}
                              {displayCurrency !== "AUTO" && converted.currency !== c.currency && (
                                <span className="block text-[9px] text-slate-700 mt-0.5">
                                  Originally {displayRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {c.currency}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
