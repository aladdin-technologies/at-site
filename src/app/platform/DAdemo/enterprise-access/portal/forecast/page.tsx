"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BarChart3, TrendingUp, Plane, DollarSign, Calendar, Building2, ArrowLeft, ChevronRight, Users } from "lucide-react";

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!target) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        function tick(now: number) {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setValue(Math.round(target * ease));
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return { value, ref };
}

function KPI({ label, value, prefix, suffix, color }: { label: string; value: number; prefix?: string; suffix?: string; color: string }) {
  const counter = useCountUp(value);
  return (
    <div ref={counter.ref} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900 font-mono">
        {prefix}{counter.value.toLocaleString()}{suffix}
      </p>
    </div>
  );
}

interface TrafficRow {
  year: number;
  month: number;
  arr_pax_direct: number;
  dep_pax_direct: number;
  transfer_pax: number;
  transit_pax: number;
  total_movements: number;
  total_mtow_tonnes: number;
  forecast_airlines: { code: string; name: string };
  forecast_airports: { code: string; name: string };
}

interface YieldRow {
  year: number;
  month: number;
  yield_rate: number;
  currency: string;
  forecast_revenue_lines: { name: string; charge_basis: string; traffic_metric: string };
  forecast_airports: { code: string; name: string };
}

export default function ForecastDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [traffic, setTraffic] = useState<TrafficRow[]>([]);
  const [yields, setYields] = useState<YieldRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/platform/DAdemo/enterprise-access/portal/verify");
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    async function load() {
      const [tRes, yRes] = await Promise.all([
        supabase.from("forecast_traffic").select("*, forecast_airlines(code, name), forecast_airports(code, name)"),
        supabase.from("forecast_yields").select("*, forecast_revenue_lines(name, charge_basis, traffic_metric), forecast_airports(code, name)"),
      ]);
      setTraffic((tRes.data ?? []) as unknown as TrafficRow[]);
      setYields((yRes.data ?? []) as unknown as YieldRow[]);
      setLoading(false);
    }
    load();
  }, [authorized]);

  const years = useMemo(() => [...new Set(traffic.map((t) => t.year))].sort(), [traffic]);

  const yearTraffic = useMemo(() => {
    return traffic.filter((t) => t.year === selectedYear);
  }, [traffic, selectedYear]);

  const totalPax = useMemo(() => {
    return yearTraffic.reduce((sum, t) => sum + t.arr_pax_direct + t.dep_pax_direct + t.transfer_pax + t.transit_pax, 0);
  }, [yearTraffic]);

  const totalMovements = useMemo(() => {
    return yearTraffic.reduce((sum, t) => sum + t.total_movements, 0);
  }, [yearTraffic]);

  const totalRevenue = useMemo(() => {
    let rev = 0;
    const yearYields = yields.filter((y) => y.year === selectedYear);
    for (const t of yearTraffic) {
      for (const y of yearYields) {
        if ((t.forecast_airports as any)?.code === (y.forecast_airports as any)?.code) {
          const metric = (y.forecast_revenue_lines as any)?.traffic_metric;
          let trafficVal = 0;
          if (metric === "dep_pax_direct") trafficVal = t.dep_pax_direct;
          else if (metric === "total_movements") trafficVal = t.total_movements;
          else if (metric === "total_mtow_tonnes") trafficVal = t.total_mtow_tonnes;
          rev += trafficVal * y.yield_rate;
        }
      }
    }
    return Math.round(rev);
  }, [yearTraffic, yields, selectedYear]);

  const monthlyRevenue = useMemo(() => {
    const monthly: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) monthly[m] = 0;
    const yearYields = yields.filter((y) => y.year === selectedYear);
    for (const t of yearTraffic) {
      for (const y of yearYields) {
        if ((t.forecast_airports as any)?.code === (y.forecast_airports as any)?.code && t.month === y.month) {
          const metric = (y.forecast_revenue_lines as any)?.traffic_metric;
          let trafficVal = 0;
          if (metric === "dep_pax_direct") trafficVal = t.dep_pax_direct;
          else if (metric === "total_movements") trafficVal = t.total_movements;
          else if (metric === "total_mtow_tonnes") trafficVal = t.total_mtow_tonnes;
          monthly[t.month] += trafficVal * y.yield_rate;
        }
      }
    }
    return monthly;
  }, [yearTraffic, yields, selectedYear]);

  const maxMonthly = Math.max(...Object.values(monthlyRevenue), 1);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const airportBreakdown = useMemo(() => {
    const byApt: Record<string, { name: string; pax: number; movements: number; revenue: number }> = {};
    const yearYields = yields.filter((y) => y.year === selectedYear);
    for (const t of yearTraffic) {
      const aptCode = (t.forecast_airports as any)?.code;
      if (!byApt[aptCode]) byApt[aptCode] = { name: (t.forecast_airports as any)?.name, pax: 0, movements: 0, revenue: 0 };
      byApt[aptCode].pax += t.arr_pax_direct + t.dep_pax_direct + t.transfer_pax + t.transit_pax;
      byApt[aptCode].movements += t.total_movements;
      for (const y of yearYields) {
        if ((y.forecast_airports as any)?.code === aptCode && y.month === t.month) {
          const metric = (y.forecast_revenue_lines as any)?.traffic_metric;
          let tv = 0;
          if (metric === "dep_pax_direct") tv = t.dep_pax_direct;
          else if (metric === "total_movements") tv = t.total_movements;
          else if (metric === "total_mtow_tonnes") tv = t.total_mtow_tonnes;
          byApt[aptCode].revenue += tv * y.yield_rate;
        }
      }
    }
    return Object.entries(byApt).map(([code, data]) => ({ code, ...data }));
  }, [yearTraffic, yields, selectedYear]);

  if (!authorized) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" alt="" className="w-7 h-7 rounded-lg" />
            <span className="text-sm font-bold tracking-wide text-gray-900">AIRPORTRONICS</span>
            <span className="text-xs text-gray-400 border-l border-gray-200 pl-3 ml-1 hidden sm:block">Aeronautical Revenue Forecasting</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Year selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title + nav */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Revenue Forecast Dashboard</h1>
            <p className="text-sm text-gray-500">Global Aviation Group — {selectedYear} Overview</p>
          </div>
          <div className="flex gap-2">
            <a href="/platform/DAdemo/enterprise-access/portal/forecast/revenue" className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5">
              <BarChart3 size={14} /> Revenue Matrix
            </a>
            <a href="/platform/DAdemo/enterprise-access/portal/forecast/scenarios" className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5">
              <TrendingUp size={14} /> Scenarios
            </a>
            <a href="/platform/DAdemo/enterprise-access/portal/forecast/team" className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5">
              <Users size={14} /> Team
            </a>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <KPI label="Total Passengers" value={totalPax} suffix="" color="#3b82f6" />
          <KPI label="Aircraft Movements" value={totalMovements} suffix="" color="#8b5cf6" />
          <KPI label="Total Revenue" value={Math.round(totalRevenue / 1000000)} prefix="$" suffix="M" color="#10b981" />
          <KPI label="Revenue Lines" value={6} suffix="" color="#f59e0b" />
        </div>

        {/* Monthly revenue chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Revenue — {selectedYear}</h2>
          <div className="flex items-end gap-1 h-48">
            {MONTHS.map((m, i) => {
              const val = monthlyRevenue[i + 1] || 0;
              const pct = (val / maxMonthly) * 100;
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-400 font-mono">${Math.round(val / 1000000)}M</span>
                  <div
                    className="w-full rounded-t-md bg-blue-500 transition-all duration-500"
                    style={{ height: `${pct}%`, minHeight: 4 }}
                  />
                  <span className="text-[10px] text-gray-500">{m}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Airport breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Airport Breakdown — {selectedYear}</h2>
          <div className="space-y-3">
            {airportBreakdown.map((apt) => (
              <div
                key={apt.code}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Building2 size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{apt.name}</p>
                    <p className="text-xs text-gray-500">{apt.code} — {apt.pax.toLocaleString()} pax, {apt.movements.toLocaleString()} movements</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 font-mono">${Math.round(apt.revenue / 1000000).toLocaleString()}M</p>
                  <p className="text-xs text-gray-500">Total revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
