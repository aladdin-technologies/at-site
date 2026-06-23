import type { AirportType } from "./supabase";

export type AgentStatus = "active" | "standby" | "inactive" | "none";

export const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  active: "#34d399",
  standby: "#fbbf24",
  inactive: "#f87171",
  none: "#374151",
};

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  active: "Active",
  standby: "Standby",
  inactive: "Inactive",
  none: "No Agent",
};

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function assignAgentStatus(
  name: string,
  airportType: AirportType,
): AgentStatus {
  if (airportType === "military" || airportType === "heliport") return "none";

  const hash = simpleHash(name);
  const bucket = hash % 100;

  if (airportType === "international") {
    // ~90% active, ~8% standby, ~2% inactive
    if (bucket < 90) return "active";
    if (bucket < 98) return "standby";
    return "inactive";
  }

  // Regional: ~55% active, ~25% standby, ~20% inactive
  if (bucket < 55) return "active";
  if (bucket < 80) return "standby";
  return "inactive";
}
