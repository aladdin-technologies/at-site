"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchExchangeRates, convertAmount } from "./useCurrency";

const STORAGE_KEY = "aero-base-currency";

let aeroCurrency = "USD";
const listeners = new Set<(c: string) => void>();

if (typeof window !== "undefined") {
  aeroCurrency = sessionStorage.getItem(STORAGE_KEY) || "USD";
}

export function getAeroCurrency() {
  return aeroCurrency;
}

export function setAeroCurrency(c: string) {
  aeroCurrency = c;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, c);
  }
  listeners.forEach((fn) => fn(c));
}

export function useAeroCurrency() {
  const [currency, setCurrency] = useState(aeroCurrency);
  useEffect(() => {
    setCurrency(aeroCurrency);
    listeners.add(setCurrency);
    return () => { listeners.delete(setCurrency); };
  }, []);
  return currency;
}

export function useAeroCurrencyConverter() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const baseCurrency = useAeroCurrency();

  useEffect(() => {
    fetchExchangeRates().then(setRates);
  }, []);

  const convert = useCallback(
    (amount: number, fromCurrency: string): number => {
      if (!baseCurrency || baseCurrency === fromCurrency) return amount;
      return convertAmount(amount, fromCurrency, baseCurrency, rates);
    },
    [rates, baseCurrency],
  );

  const symbol = useMemo(() => {
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", INR: "₹",
      AED: "د.إ", SAR: "﷼", KRW: "₩", THB: "฿", TRY: "₺", BRL: "R$",
      CHF: "CHF", AUD: "A$", CAD: "C$", SGD: "S$", HKD: "HK$", MYR: "RM",
      ZAR: "R", MXN: "MX$", SEK: "kr", NOK: "kr", DKK: "kr", PLN: "zł",
      CZK: "Kč", HUF: "Ft", NZD: "NZ$", PHP: "₱", IDR: "Rp", TWD: "NT$",
      QAR: "QR", BHD: "BD", KWD: "KD", OMR: "OMR",
    };
    return symbols[baseCurrency] || baseCurrency;
  }, [baseCurrency]);

  const availableCurrencies = useMemo(() => {
    return Object.keys(rates).sort();
  }, [rates]);

  return { baseCurrency, setAeroCurrency, convert, symbol, availableCurrencies, rates };
}
