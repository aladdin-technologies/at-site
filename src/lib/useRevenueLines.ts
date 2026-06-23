"use client";

import { useEffect, useState } from "react";
import { supabase, type RevenueLineRow } from "./supabase";

let cached: RevenueLineRow[] | null = null;
let loadPromise: Promise<void> | null = null;

async function fetchLines() {
  if (cached) return;
  const { data } = await supabase
    .from("revenue_lines")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  cached = data ?? [];
}

export function useRevenueLines() {
  const [lines, setLines] = useState<RevenueLineRow[]>(cached ?? []);

  useEffect(() => {
    if (cached) {
      setLines(cached);
      return;
    }
    if (!loadPromise) loadPromise = fetchLines();
    loadPromise.then(() => setLines(cached!));
  }, []);

  const aeroLines = lines.filter((l) => l.category === "aero");
  const nonAeroLines = lines.filter((l) => l.category === "non_aero");

  return { lines, aeroLines, nonAeroLines };
}
