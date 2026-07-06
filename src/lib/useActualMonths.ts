"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "aero-actual-months";

let cachedMonths: Set<number> | null = null;
const listeners = new Set<(m: Set<number>) => void>();

function loadMonths(): Set<number> {
  if (typeof window === "undefined") return new Set([1, 2, 3, 4, 5, 6]);
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set([1, 2, 3, 4, 5, 6]);
}

export function getActualMonths(): Set<number> {
  if (!cachedMonths) cachedMonths = loadMonths();
  return cachedMonths;
}

export function setActualMonths(months: Set<number>) {
  cachedMonths = months;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...months]));
  }
  listeners.forEach(fn => fn(new Set(months)));
}

export function useActualMonths() {
  const [months, setMonths] = useState<Set<number>>(getActualMonths);

  useEffect(() => {
    setMonths(getActualMonths());
    listeners.add(setMonths);
    return () => { listeners.delete(setMonths); };
  }, []);

  return { actualMonths: months, setActualMonths };
}
