"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchExchangeRates, convertAmount } from "./useCurrency";
import { loadSetting, saveSetting } from "./persistSettings";

let aeroCurrency = "USD";
let loaded = false;
const listeners = new Set<(c: string) => void>();

export function getAeroCurrency() {
  return aeroCurrency;
}

export function setAeroCurrency(c: string) {
  aeroCurrency = c;
  listeners.forEach((fn) => fn(c));
  saveSetting("base_currency", c);
}

export function useAeroCurrency() {
  const [currency, setCurrency] = useState(aeroCurrency);
  useEffect(() => {
    if (!loaded) {
      loaded = true;
      loadSetting<string>("base_currency", "USD").then(c => {
        aeroCurrency = c;
        setCurrency(c);
        listeners.forEach(fn => fn(c));
      });
    }
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
