"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/platform/TopBar";
import { useRevenueLines } from "@/lib/useRevenueLines";
import { RevenueLineCard } from "@/components/platform/RevenueLineCard";
import { REVENUE_CATEGORY_COLORS } from "@/lib/supabase";
import { Plane, ShoppingBag, ArrowLeft } from "lucide-react";

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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const counter = useCountUp(value);
  return (
    <div
      ref={counter.ref}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 truncate">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold font-mono text-white">
        {counter.value}
      </p>
    </div>
  );
}

export default function RevenuePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const { lines, aeroLines, nonAeroLines } = useRevenueLines();

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/platform/DAdemo/enterprise-access/portal/verify");
      return;
    }
    setAuthorized(true);
    const header = document.querySelector("header:not([class])");
    const footer = document.querySelector("footer");
    if (header) (header as HTMLElement).style.display = "none";
    if (footer) (footer as HTMLElement).style.display = "none";
    return () => {
      if (header) (header as HTMLElement).style.display = "";
      if (footer) (footer as HTMLElement).style.display = "";
    };
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#060a14] text-white">
      <TopBar />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Revenue Intelligence</h1>
          <p className="text-sm text-slate-500">
            Global airport revenue line taxonomy — aeronautical and
            non-aeronautical streams
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <StatCard label="Total revenue lines" value={lines.length} color="#38bdf8" />
          <StatCard label="Aeronautical" value={aeroLines.length} color={REVENUE_CATEGORY_COLORS.aero} />
          <StatCard label="Non-Aeronautical" value={nonAeroLines.length} color={REVENUE_CATEGORY_COLORS.non_aero} />
        </div>

        {/* Aeronautical section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10">
              <Plane size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Aeronautical Revenue Lines
              </h2>
              <p className="text-[12px] text-slate-500">
                Charges levied on airlines and passengers for using airport
                infrastructure and services
              </p>
            </div>
            <span className="ml-auto text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400">
              {aeroLines.length} lines
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aeroLines.map((line) => (
              <RevenueLineCard key={line.id} line={line} />
            ))}
          </div>
        </div>

        {/* Non-Aeronautical section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10">
              <ShoppingBag size={20} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Non-Aeronautical Revenue Lines
              </h2>
              <p className="text-[12px] text-slate-500">
                Commercial revenue from passengers, tenants, concessions and
                airport property
              </p>
            </div>
            <span className="ml-auto text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-violet-500/10 text-violet-400">
              {nonAeroLines.length} lines
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nonAeroLines.map((line) => (
              <RevenueLineCard key={line.id} line={line} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
