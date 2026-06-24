"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/platform/TopBar";
import { Database, Cpu, MemoryStick, HardDrive, Activity, Wifi, Clock, Server, Zap } from "lucide-react";

function useAnimatedValue(base: number, variance: number, interval = 2000) {
  const [value, setValue] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      const delta = (Math.random() - 0.5) * 2 * variance;
      setValue((prev) => {
        const next = prev + delta;
        return Math.max(base - variance * 2, Math.min(base + variance * 2, next));
      });
    }, interval);
    return () => clearInterval(id);
  }, [base, variance, interval]);
  return value;
}

function LiveGauge({
  label,
  value,
  max,
  unit,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  icon: React.ElementType;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const displayVal = value.toFixed(1);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
            <Icon size={16} style={{ color }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 line-clamp-2">{label}</p>
            <p className="text-lg font-bold font-mono text-white">
              {displayVal}
              <span className="text-[11px] text-slate-500 ml-1">{unit}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-600">{max} {unit} total</p>
          <p className="text-sm font-mono font-bold" style={{ color }}>{pct.toFixed(1)}%</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function LiveStat({
  label,
  value,
  unit,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
          <Icon size={16} style={{ color }} />
        </div>
        <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 line-clamp-2">{label}</p>
      </div>
      <p className="text-2xl font-bold font-mono text-white">
        {value}
        <span className="text-[11px] text-slate-500 ml-1">{unit}</span>
      </p>
      {subtitle && <p className="text-[10px] text-slate-600 mt-1">{subtitle}</p>}
    </div>
  );
}

function ActivityLog() {
  const [logs, setLogs] = useState<{ time: string; msg: string; type: string }[]>([]);
  const logRef = useRef(0);

  const activities = [
    { msg: "Agent LHR: indexed 12 new AIP documents", type: "index" },
    { msg: "Agent SIN: charge schedule verified", type: "verify" },
    { msg: "Agent CDG: 3 revenue lines updated", type: "update" },
    { msg: "Agent JFK: parking charge rate confirmed", type: "verify" },
    { msg: "Agent FRA: noise surcharge data extracted", type: "extract" },
    { msg: "Agent DXB: terminal rental rates indexed", type: "index" },
    { msg: "Agent NRT: landing charge formula validated", type: "verify" },
    { msg: "Agent AMS: security charge updated", type: "update" },
    { msg: "Agent ICN: passenger charge differential confirmed", type: "verify" },
    { msg: "Agent BKK: 5 new source documents found", type: "index" },
    { msg: "Agent SYD: cargo handling charges extracted", type: "extract" },
    { msg: "Agent ORD: FY2026 rate book processed", type: "index" },
    { msg: "Agent ZRH: weight class rates updated", type: "update" },
    { msg: "Agent HKG: approach charge recalculated", type: "verify" },
    { msg: "Agent DEL: AAI tariff schedule parsed", type: "extract" },
  ];

  useEffect(() => {
    const initial = Array.from({ length: 6 }, (_, i) => {
      const a = activities[(logRef.current + i) % activities.length];
      const t = new Date(Date.now() - (5 - i) * 8000);
      return { time: t.toLocaleTimeString(), msg: a.msg, type: a.type };
    });
    setLogs(initial);
    logRef.current = 6;

    const id = setInterval(() => {
      const a = activities[logRef.current % activities.length];
      logRef.current++;
      setLogs((prev) => [
        { time: new Date().toLocaleTimeString(), msg: a.msg, type: a.type },
        ...prev.slice(0, 7),
      ]);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const typeColors: Record<string, string> = {
    index: "#22d3ee",
    verify: "#34d399",
    update: "#fbbf24",
    extract: "#a78bfa",
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-cyan-400" />
        <p className="text-[10px] font-semibold tracking-wider uppercase text-cyan-400">Live Agent Activity</p>
      </div>
      <div className="space-y-2">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 text-[11px] transition-opacity duration-500 ${i === 0 ? "opacity-100" : i < 4 ? "opacity-70" : "opacity-40"}`}
          >
            <span className="text-slate-600 font-mono shrink-0">{log.time}</span>
            <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: typeColors[log.type] || "#3b82f6" }} />
            <span className="text-slate-400 truncate">{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SystemPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [uptime, setUptime] = useState("0d 0h 0m");

  // CPU drives everything — RAM, network, requests all correlate
  const cpuBase = useAnimatedValue(84, 7, 1200);
  const cpuUsage = cpuBase;
  // RAM follows CPU with slight delay and smaller variance
  const ramBase = 52 + (cpuBase - 84) * 0.15;
  const ramJitter = useAnimatedValue(0, 0.8, 1800);
  const ramUsage = ramBase + ramJitter;
  // Network correlates with CPU/requests
  const networkIn = 3.2 + (cpuBase - 84) * 0.08 + useAnimatedValue(0, 0.3, 1600);
  const networkOut = 2.6 + (cpuBase - 84) * 0.06 + useAnimatedValue(0, 0.2, 2000);
  // Active agents and requests follow CPU load
  const activeAgents = 2520 + (cpuBase - 84) * 8 + useAnimatedValue(0, 15, 2500);
  const requestsPerSec = 1100 + (cpuBase - 84) * 20 + useAnimatedValue(0, 60, 1400);

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

    // Uptime counter
    const start = Date.now() - (14 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000 + 23 * 60 * 1000);
    const tick = () => {
      const diff = Date.now() - start;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setUptime(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);

    return () => {
      clearInterval(id);
      if (header) (header as HTMLElement).style.display = "";
      if (footer) (footer as HTMLElement).style.display = "";
    };
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#060a14] text-white">
      <TopBar />

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Server size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">System Insights</h1>
            <p className="text-sm text-slate-500">Live infrastructure and agent performance metrics</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex items-center justify-center w-3 h-3">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-[ping_2s_ease-in-out_infinite] opacity-40" />
              <span className="relative w-2 h-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">All systems operational</span>
          </div>
        </div>

        {/* Live gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <LiveGauge label="CPU Utilization" value={cpuUsage} max={100} unit="%" color="#22d3ee" icon={Cpu} />
          <LiveGauge label="RAM Usage" value={ramUsage} max={64} unit="GB" color="#a78bfa" icon={MemoryStick} />
        </div>

        {/* Static + semi-live stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <LiveStat label="Total Storage" value="43.2" unit="TB" icon={HardDrive} color="#f59e0b" subtitle="of 50 TB used (86.4%)" />
          <LiveStat label="Data Collected" value="41.8" unit="TB" icon={Database} color="#a78bfa" subtitle="Raw AIP documents, PDFs, source files" />
          <LiveStat label="Data Processed" value="1.2" unit="TB" icon={Database} color="#34d399" subtitle="Structured, indexed, query-ready" />
          <LiveStat label="System Overhead" value="0.2" unit="TB" icon={Server} color="#64748b" subtitle="OS, runtime, logs, cache" />
          <LiveStat label="Uptime" value={uptime} unit="" icon={Clock} color="#34d399" subtitle="Since last restart" />
          <LiveStat label="Active Agents" value={Math.round(activeAgents).toLocaleString()} unit="" icon={Zap} color="#22d3ee" subtitle="Processing live data" />
          <LiveStat label="Requests / sec" value={Math.round(requestsPerSec).toLocaleString()} unit="req/s" icon={Wifi} color="#f87171" subtitle="API throughput" />
          <LiveStat label="Processing Rate" value="2.8" unit="%" icon={Activity} color="#fbbf24" subtitle="1.2 TB processed of 41.8 TB collected" />
        </div>

        {/* Network I/O */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <LiveGauge label="Network In" value={networkIn} max={5} unit="Gbps" color="#34d399" icon={Wifi} />
          <LiveGauge label="Network Out" value={networkOut} max={5} unit="Gbps" color="#3b82f6" icon={Wifi} />
        </div>

        {/* Live activity log */}
        <ActivityLog />
      </div>
    </div>
  );
}
