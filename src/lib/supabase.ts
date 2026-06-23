import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type AirportType = "international" | "military" | "heliport" | "regional";

export interface AirportRow {
  id: string;
  icao_code: string;
  iata_code: string | null;
  name: string;
  country: string;
  city: string | null;
  latitude: number;
  longitude: number;
  aip_source_url: string | null;
  country_name: string | null;
  airportType: AirportType;
}

const MILITARY_KEYWORDS = ["air force", "air base", "afb", "naval", "military", "raf "];
const HELIPORT_KEYWORDS = ["heliport", "helipad", "helicopter"];

export function classifyAirport(name: string): AirportType {
  const lower = name.toLowerCase();
  if (MILITARY_KEYWORDS.some((k) => lower.includes(k))) return "military";
  if (HELIPORT_KEYWORDS.some((k) => lower.includes(k))) return "heliport";
  if (lower.includes("international")) return "international";
  return "regional";
}

export const AIRPORT_TYPE_COLORS: Record<AirportType, string> = {
  international: "#22d3ee",
  regional: "#3b82f6",
  military: "#f59e0b",
  heliport: "#a78bfa",
};

export const AIRPORT_TYPE_RING_COLORS: Record<AirportType, string> = {
  international: "rgba(34, 211, 238, 0.45)",
  regional: "rgba(59, 130, 246, 0.35)",
  military: "rgba(245, 158, 11, 0.40)",
  heliport: "rgba(167, 139, 250, 0.35)",
};

export type RevenueCategory = "aero" | "non_aero";

export interface RevenueLineRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: RevenueCategory;
  subcategory: string | null;
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
}

export const REVENUE_CATEGORY_LABELS: Record<RevenueCategory, string> = {
  aero: "Aeronautical",
  non_aero: "Non-Aeronautical",
};

export const REVENUE_CATEGORY_COLORS: Record<RevenueCategory, string> = {
  aero: "#22d3ee",
  non_aero: "#a78bfa",
};

export const AIRPORT_TYPE_LABELS: Record<AirportType, string> = {
  international: "International",
  regional: "Regional / Domestic",
  military: "Military / Air Base",
  heliport: "Heliport",
};
