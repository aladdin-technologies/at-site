"use client";

import { useState, useEffect, useCallback } from "react";

export type AccessLevel = "none" | "view" | "full";

export interface TabPermissions {
  dashboard: AccessLevel;
  analytics: AccessLevel;
  historicals: AccessLevel;
  budget: AccessLevel;
  scenarios: AccessLevel;
  charges: AccessLevel;
  revenue: AccessLevel;
  settings: AccessLevel;
}

export const TAB_KEYS: (keyof TabPermissions)[] = [
  "dashboard", "analytics", "historicals", "budget",
  "scenarios", "charges", "revenue", "settings",
];

export const TAB_LABELS: Record<keyof TabPermissions, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  historicals: "Historicals",
  budget: "Budget",
  scenarios: "Scenarios",
  charges: "Charges",
  revenue: "Revenue Lines",
  settings: "Settings",
};

export const ADMIN_PERMISSIONS: TabPermissions = {
  dashboard: "full", analytics: "full", historicals: "full", budget: "full",
  scenarios: "full", charges: "full", revenue: "full", settings: "full",
};

const STORAGE_KEY = "aero-permissions";

let cachedPermissions: TabPermissions | null = null;
const listeners = new Set<(p: TabPermissions) => void>();

function loadPermissions(): TabPermissions {
  if (typeof window === "undefined") return ADMIN_PERMISSIONS;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ADMIN_PERMISSIONS;
}

export function getPermissions(): TabPermissions {
  if (!cachedPermissions) cachedPermissions = loadPermissions();
  return cachedPermissions;
}

export function setPermissions(p: TabPermissions) {
  cachedPermissions = p;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }
  listeners.forEach(fn => fn(p));
}

export function usePermissions() {
  const [perms, setPerms] = useState<TabPermissions>(getPermissions);

  useEffect(() => {
    setPerms(getPermissions());
    listeners.add(setPerms);
    return () => { listeners.delete(setPerms); };
  }, []);

  const canView = useCallback((tab: keyof TabPermissions) => perms[tab] !== "none", [perms]);
  const canEdit = useCallback((tab: keyof TabPermissions) => perms[tab] === "full", [perms]);
  const isViewOnly = useCallback((tab: keyof TabPermissions) => perms[tab] === "view", [perms]);

  return { permissions: perms, setPermissions, canView, canEdit, isViewOnly };
}

export function pathToTab(pathname: string): keyof TabPermissions | null {
  if (pathname === "/aero") return "dashboard";
  const segment = pathname.replace("/aero/", "").split("/")[0];
  const map: Record<string, keyof TabPermissions> = {
    analytics: "analytics", historicals: "historicals", budget: "budget",
    scenarios: "scenarios", charges: "charges", revenue: "revenue",
    settings: "settings",
  };
  return map[segment] || null;
}
