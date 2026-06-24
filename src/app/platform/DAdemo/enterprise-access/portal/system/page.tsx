"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/platform/TopBar";
import { Database, Cpu, MemoryStick, HardDrive, Activity, Wifi, Clock, Server, Zap, ArrowLeft } from "lucide-react";

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

const AIRPORTS = ["LHR","CDG","AMS","FRA","IST","SIN","HND","NRT","ICN","HKG","JFK","LAX","ORD","DFW","ATL","DEN","SFO","SEA","MIA","DXB","DOH","BKK","DEL","BOM","KUL","SYD","MEL","AKL","ZRH","VIE","MUC","MAD","BCN","FCO","ARN","OSL","CPH","DUB","BRU","WAW","PRG","LIS","GRU","MEX","YYZ","EZE","SCL","CAI","JNB","NBO","TPE","MNL","CGK"];
const ACTIONS_INDEX = ["indexed {n} new AIP documents","scanned {n} source PDFs","found {n} new regulatory filings","crawled {n} airport authority pages","discovered {n} updated charge tables","ingested {n} conditions-of-use updates"];
const ACTIONS_VERIFY = ["landing charge formula validated","passenger charge rate confirmed","security fee cross-referenced","parking tariff verified against AIP","noise surcharge brackets confirmed","charge schedule effective dates verified","MTOW tier boundaries validated"];
const ACTIONS_UPDATE = ["{n} revenue lines updated","parking charge rate revised","security screening fee adjusted","passenger service charge recalculated","emission charge coefficient updated","gate/aerobridge rate refreshed"];
const ACTIONS_EXTRACT = ["extracted landing fees from AIP GEN 4.1","parsed noise category rate table","extracted {n} charge formulas from PDF","terminal navigation charge data extracted","fuel throughput rate extracted","ground handling fee structure parsed"];

function randomActivity(): { msg: string; type: string } {
  const airport = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
  const roll = Math.random();
  const n = Math.floor(Math.random() * 15) + 2;
  let actions: string[], type: string;
  if (roll < 0.3) { actions = ACTIONS_INDEX; type = "index"; }
  else if (roll < 0.55) { actions = ACTIONS_VERIFY; type = "verify"; }
  else if (roll < 0.8) { actions = ACTIONS_UPDATE; type = "update"; }
  else { actions = ACTIONS_EXTRACT; type = "extract"; }
  const action = actions[Math.floor(Math.random() * actions.length)].replace("{n}", String(n));
  return { msg: `Agent ${airport}: ${action}`, type };
}

function ActivityLog() {
  const [logs, setLogs] = useState<{ time: string; msg: string; type: string }[]>([]);

  useEffect(() => {
    const initial = Array.from({ length: 8 }, (_, i) => {
      const a = randomActivity();
      const t = new Date(Date.now() - (7 - i) * 4000);
      return { time: t.toLocaleTimeString(), msg: a.msg, type: a.type };
    });
    setLogs(initial);

    const id = setInterval(() => {
      const a = randomActivity();
      setLogs((prev) => [
        { time: new Date().toLocaleTimeString(), msg: a.msg, type: a.type },
        ...prev.slice(0, 9),
      ]);
    }, 3000 + Math.random() * 2000);
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
  const networkIn = 3.9 + (cpuBase - 84) * 0.06 + useAnimatedValue(0, 0.2, 1600);
  const networkOut = 3.6 + (cpuBase - 84) * 0.05 + useAnimatedValue(0, 0.15, 2000);
  // Active agents and requests follow CPU load
  const activeAgents = 2520 + (cpuBase - 84) * 8 + useAnimatedValue(0, 15, 2500);
  const requestsPerSec = 1100 + (cpuBase - 84) * 20 + useAnimatedValue(0, 60, 1400);

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/platform/DAdemo/enterprise-access/portal/verify");
      return;
    }
    setAuthorized(true);

    // Uptime counter — fixed start date, grows naturally over time
    const start = new Date("2026-06-09T03:15:00Z").getTime();
    const tick = () => {
      const diff = Date.now() - start;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUptime(`${d}d ${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);

    return () => {
      clearInterval(id);
    };
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#060a14] text-white">
      <TopBar />

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft size={16} /> Back
        </button>

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
            <span className="text-[11px] text-emerald-400 font-medium">4 of 4 systems operational</span>
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
