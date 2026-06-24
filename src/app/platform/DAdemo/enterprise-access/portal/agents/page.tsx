"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/platform/TopBar";
import { useAirports } from "@/lib/useAirports";
import {
  assignAgentStatus,
  AGENT_STATUS_COLORS,
  AGENT_STATUS_LABELS,
  type AgentStatus,
} from "@/lib/agentStatus";
import { AIRPORT_TYPE_LABELS } from "@/lib/supabase";
import { Search, ChevronRight, ArrowLeft } from "lucide-react";

function useCountUp(target: number, duration = 1600) {
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

function StatusCard({
  status,
  count,
  active,
  onClick,
}: {
  status: AgentStatus;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const counter = useCountUp(count);
  return (
    <div
      ref={counter.ref}
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer h-full ${
        active
          ? "border-white/20 bg-white/[0.06]"
          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex items-center justify-center w-5 h-5">
          {status !== "none" && (
            <span
              className="absolute inset-0 rounded-full animate-[ping_2s_ease-in-out_infinite] opacity-30"
              style={{ backgroundColor: AGENT_STATUS_COLORS[status] }}
            />
          )}
          <span
            className="relative w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: AGENT_STATUS_COLORS[status] }}
          />
        </span>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
          {AGENT_STATUS_LABELS[status]}
        </span>
      </div>
      <p className="text-2xl font-bold font-mono text-white">
        {counter.value.toLocaleString()}
      </p>
    </div>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const { airports } = useAirports();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AgentStatus | "all">("all");

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/platform/DAdemo/enterprise-access/portal/verify");
      return;
    }
    setAuthorized(true);
  }, [router]);

  const airportsWithStatus = useMemo(
    () =>
      airports.map((a) => ({
        ...a,
        agentStatus: assignAgentStatus(a.name, a.airportType),
      })),
    [airports],
  );

  const statusCounts = useMemo(() => {
    const c: Record<AgentStatus, number> = { active: 0, standby: 0, inactive: 0, none: 0 };
    for (const a of airportsWithStatus) c[a.agentStatus]++;
    return c;
  }, [airportsWithStatus]);

  const filtered = useMemo(() => {
    let list = airportsWithStatus;
    if (filterStatus !== "all") {
      list = list.filter((a) => a.agentStatus === filterStatus);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.iata_code && a.iata_code.toLowerCase().includes(q)) ||
          a.icao_code.toLowerCase().includes(q) ||
          (a.city && a.city.toLowerCase().includes(q)) ||
          a.country.toLowerCase().includes(q),
      );
    }
    return list;
  }, [airportsWithStatus, search, filterStatus]);

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
          <h1 className="text-2xl font-bold text-white">
            Global Intelligence Agents
          </h1>
          <p className="text-sm text-slate-500">
            Real-time agent deployment status across all mapped airports
          </p>
        </div>

        {/* Status summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {(["active", "standby", "inactive", "none"] as AgentStatus[]).map(
            (status) => (
              <StatusCard
                key={status}
                status={status}
                count={statusCounts[status]}
                active={filterStatus === status}
                onClick={() =>
                  setFilterStatus(filterStatus === status ? "all" : status)
                }
              />
            ),
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search by airport name, IATA, ICAO, city or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        {/* Results count */}
        <p className="text-[11px] text-slate-500 font-medium mb-4">
          Showing {filtered.length.toLocaleString()} of{" "}
          {airportsWithStatus.length.toLocaleString()} airports
          {filterStatus !== "all" &&
            ` — filtered by ${AGENT_STATUS_LABELS[filterStatus]}`}
          {filterStatus !== "all" && (
            <button
              onClick={() => setFilterStatus("all")}
              className="ml-2 text-cyan-400 hover:underline"
            >
              Clear filter
            </button>
          )}
        </p>

        {/* Table */}
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                    Airport
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500 hidden sm:table-cell">
                    IATA
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500 hidden md:table-cell">
                    City
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500 hidden md:table-cell">
                    Country
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500 hidden lg:table-cell">
                    Type
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => router.push(`/platform/DAdemo/enterprise-access/portal/agents/${a.id}`)}
                    className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="relative flex items-center justify-center w-4 h-4">
                          {a.agentStatus !== "none" && (
                            <span
                              className="absolute inset-0 rounded-full animate-[ping_2s_ease-in-out_infinite] opacity-40"
                              style={{ backgroundColor: AGENT_STATUS_COLORS[a.agentStatus] }}
                            />
                          )}
                          <span
                            className="relative w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: AGENT_STATUS_COLORS[a.agentStatus] }}
                          />
                        </span>
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: AGENT_STATUS_COLORS[a.agentStatus] }}
                        >
                          {AGENT_STATUS_LABELS[a.agentStatus]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white font-medium group-hover:text-cyan-400 transition-colors">
                      {a.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-400 hidden sm:table-cell">
                      {a.iata_code || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                      {a.city || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                      {a.country_name || a.country}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px] hidden lg:table-cell">
                      {AIRPORT_TYPE_LABELS[a.airportType]}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 200 && (
            <div className="px-4 py-3 text-center text-[11px] text-slate-500 border-t border-white/[0.06]">
              Showing first 200 of {filtered.length.toLocaleString()} results.
              Use search to narrow down.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
