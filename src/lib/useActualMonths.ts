"use client";

import { useState, useEffect } from "react";
import { loadSetting, saveSetting } from "./persistSettings";

let cachedMonths: Set<number> = new Set([1, 2, 3, 4, 5, 6]);
let loaded = false;
const listeners = new Set<(m: Set<number>) => void>();

export function getActualMonths(): Set<number> {
  return cachedMonths;
}

export function setActualMonths(months: Set<number>) {
  cachedMonths = months;
  listeners.forEach(fn => fn(new Set(months)));
  saveSetting("actual_months", [...months]);
}

export function useActualMonths() {
  const [months, setMonths] = useState<Set<number>>(cachedMonths);

  useEffect(() => {
    if (!loaded) {
      loaded = true;
      loadSetting<number[]>("actual_months", [1, 2, 3, 4, 5, 6]).then(arr => {
        cachedMonths = new Set(arr);
        setMonths(new Set(arr));
        listeners.forEach(fn => fn(new Set(arr)));
      });
    }
    listeners.add(setMonths);
    return () => { listeners.delete(setMonths); };
  }, []);

  return { actualMonths: months, setActualMonths };
}
