"use client";

import { useEffect, useState } from "react";
import {
  supabase,
  classifyAirport,
  type AirportRow,
  type AirportType,
} from "@/lib/supabase";

export interface AirportStats {
  total: number;
  international: number;
  regional: number;
  military: number;
  heliport: number;
  agentsDeployed: number;
  activeAgents: number;
}

const EMPTY_STATS: AirportStats = {
  total: 0,
  international: 0,
  regional: 0,
  military: 0,
  heliport: 0,
  agentsDeployed: 0,
  activeAgents: 0,
};

let cachedAirports: AirportRow[] | null = null;
let cachedStats: AirportStats = EMPTY_STATS;
let loadPromise: Promise<void> | null = null;

async function fetchAirports() {
  if (cachedAirports) return;
  const all: AirportRow[] = [];
  let offset = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("airports")
      .select("id,icao_code,iata_code,name,country,city,latitude,longitude,airport_type")
      .range(offset, offset + batchSize - 1);
    if (error || !data || data.length === 0) break;
    for (const row of data) {
      if (row.latitude && row.longitude && Math.abs(row.latitude) < 85) {
        all.push({
          ...row,
          airportType: (row.airport_type as AirportType) || classifyAirport(row.name),
        });
      }
    }
    offset += batchSize;
    if (data.length < batchSize) break;
  }
  cachedAirports = all;

  const counts: Record<AirportType, number> = { international: 0, regional: 0, military: 0, heliport: 0 };
  for (const a of all) counts[a.airportType]++;

  cachedStats = {
    total: all.length,
    ...counts,
    agentsDeployed: counts.international + counts.regional,
    activeAgents: counts.international,
  };
}

export function useAirports() {
  const [airports, setAirports] = useState<AirportRow[]>(cachedAirports ?? []);
  const [stats, setStats] = useState<AirportStats>(cachedStats);

  useEffect(() => {
    if (cachedAirports) {
      setAirports(cachedAirports);
      setStats(cachedStats);
      return;
    }
    if (!loadPromise) {
      loadPromise = fetchAirports();
    }
    loadPromise.then(() => {
      setAirports(cachedAirports!);
      setStats(cachedStats);
    });
  }, []);

  return { airports, stats };
}
