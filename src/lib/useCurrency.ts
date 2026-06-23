"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * Exchange-rate service — Frankfurter v2, same approach as Expento.
 * Fetches ALL 150+ currencies with USD as base.
 * In-memory cache with 1-hour TTL.
 * Pivot through USD for any pair conversion.
 */

interface RateCache {
  rates: Record<string, number>;
  fetchedAt: number;
}

const CACHE_TTL = 3600_000; // 1 hour
let rateCache: RateCache | null = null;
let fetchPromise: Promise<Record<string, number>> | null = null;

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  if (rateCache && Date.now() - rateCache.fetchedAt < CACHE_TTL) {
    return rateCache.rates;
  }

  try {
    const res = await fetch("https://api.frankfurter.dev/v2/rates?base=USD");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const rates: Record<string, number> = { USD: 1 };
    if (Array.isArray(data)) {
      for (const entry of data) {
        if (entry.quote && typeof entry.rate === "number") {
          rates[entry.quote.toUpperCase()] = entry.rate;
        }
      }
    }

    rateCache = { rates, fetchedAt: Date.now() };
    return rates;
  } catch {
    if (rateCache) return rateCache.rates;
    return { USD: 1 };
  }
}

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  if (!amount) return amount;
  const f = from?.toUpperCase();
  const t = to?.toUpperCase();
  if (!f || !t || f === t) return amount;
  const fromRate = rates[f];
  const toRate = rates[t];
  if (!fromRate || !toRate) return amount;
  return (amount / fromRate) * toRate;
}

export function useExchangeRates() {
  const [rates, setRates] = useState<Record<string, number>>(rateCache?.rates ?? {});

  useEffect(() => {
    if (rateCache && Date.now() - rateCache.fetchedAt < CACHE_TTL) {
      setRates(rateCache.rates);
      return;
    }
    if (!fetchPromise) fetchPromise = fetchExchangeRates().finally(() => { fetchPromise = null; });
    fetchPromise.then((r) => setRates(r));
  }, []);

  return rates;
}

// Global currency state — shared across TopBar dropdown and all pages
let globalCurrency = "AUTO";
const listeners = new Set<(c: string) => void>();

export function getDisplayCurrency() {
  return globalCurrency;
}

export function setDisplayCurrency(c: string) {
  globalCurrency = c;
  listeners.forEach((fn) => fn(c));
}

export function useDisplayCurrency() {
  const [currency, setCurrency] = useState(globalCurrency);
  useEffect(() => {
    listeners.add(setCurrency);
    return () => { listeners.delete(setCurrency); };
  }, []);
  return currency;
}

export function useCurrencyConverter() {
  const rates = useExchangeRates();
  const displayCurrency = useDisplayCurrency();

  const convert = useCallback(
    (amount: number, fromCurrency: string): { value: number; currency: string } => {
      if (displayCurrency === "AUTO" || !rates[displayCurrency.toUpperCase()]) {
        return { value: amount, currency: fromCurrency };
      }
      const converted = convertAmount(amount, fromCurrency, displayCurrency, rates);
      return { value: converted, currency: displayCurrency };
    },
    [rates, displayCurrency],
  );

  const availableCurrencies = useMemo(() => {
    const majors = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "SGD", "HKD", "KRW", "CNY", "INR", "AED", "SAR", "THB", "MYR", "IDR", "PHP", "TWD", "NZD", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "TRY", "ZAR", "BRL", "MXN"];
    const all = Object.keys(rates).sort();
    const majorSet = new Set(majors);
    const rest = all.filter((c) => !majorSet.has(c));
    return ["AUTO", ...majors.filter((c) => rates[c]), ...rest];
  }, [rates]);

  return { displayCurrency, setDisplayCurrency, convert, availableCurrencies, rates };
}
