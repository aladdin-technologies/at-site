"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { TopBar } from "@/components/platform/TopBar";
import {
  supabase,
  classifyAirport,
  AIRPORT_TYPE_COLORS,
  AIRPORT_TYPE_LABELS,
  type AirportType,
} from "@/lib/supabase";
import {
  assignAgentStatus,
  AGENT_STATUS_COLORS,
  AGENT_STATUS_LABELS,
} from "@/lib/agentStatus";
import {
  ArrowLeft,
  Plane,
  MapPin,
  ExternalLink,
  Globe,
  Radio,
  Tag,
  Navigation,
} from "lucide-react";

interface AirportDetail {
  id: string;
  icao_code: string;
  iata_code: string | null;
  name: string;
  country: string;
  city: string | null;
  latitude: number;
  longitude: number;
  aip_source_url: string | null;
  airport_type: string | null;
  created_at: string;
  updated_at: string;
  country_name: string | null;
}

export default function AirportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [authorized, setAuthorized] = useState(false);
  const [airport, setAirport] = useState<AirportDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!authorized || !params.id) return;
    async function load() {
      const { data } = await supabase
        .from("airports")
        .select("*")
        .eq("id", params.id)
        .single();
      setAirport(data);
      setLoading(false);
    }
    load();
  }, [authorized, params.id]);

  if (!authorized) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a14] text-white">
        <TopBar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!airport) {
    return (
      <div className="min-h-screen bg-[#060a14] text-white">
        <TopBar />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-slate-400">Airport not found</p>
          <button
            onClick={() => router.push("/platform/DAdemo/enterprise-access/portal/agents")}
            className="text-cyan-400 hover:underline text-sm"
          >
            Back to agents
          </button>
        </div>
      </div>
    );
  }

  const airportType = (airport.airport_type as AirportType) || classifyAirport(airport.name);
  const agentStatus = assignAgentStatus(airport.name, airportType);
  const mapsUrl = `https://www.google.com/maps?q=${airport.latitude},${airport.longitude}`;
  const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${airport.latitude},${airport.longitude}&zoom=14&maptype=satellite`;

  return (
    <div className="min-h-screen bg-[#060a14] text-white">
      <TopBar />

      <div className="max-w-[1000px] mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: AIRPORT_TYPE_COLORS[airportType] + "18" }}
            >
              <Plane size={24} style={{ color: AIRPORT_TYPE_COLORS[airportType] }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{airport.name}</h1>
              <p className="text-slate-500 text-sm">
                {airport.city && `${airport.city}, `}{airport.country_name || airport.country}
                <span className="mx-2 text-slate-700">/</span>
                {AIRPORT_TYPE_LABELS[airportType]}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2.5 px-4 py-2 rounded-full border text-sm font-semibold"
            style={{
              backgroundColor: AGENT_STATUS_COLORS[agentStatus] + "12",
              borderColor: AGENT_STATUS_COLORS[agentStatus] + "30",
              color: AGENT_STATUS_COLORS[agentStatus],
            }}
          >
            <span className="relative flex items-center justify-center w-4 h-4">
              {agentStatus !== "none" && (
                <span
                  className="absolute inset-0 rounded-full animate-[ping_2s_ease-in-out_infinite] opacity-40"
                  style={{ backgroundColor: AGENT_STATUS_COLORS[agentStatus] }}
                />
              )}
              <span
                className="relative w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: AGENT_STATUS_COLORS[agentStatus] }}
              />
            </span>
            Agent {AGENT_STATUS_LABELS[agentStatus]}
          </div>
        </div>

        {/* Codes strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <InfoCard icon={<Tag size={16} />} label="IATA Code" value={airport.iata_code || "—"} mono />
          <InfoCard icon={<Tag size={16} />} label="ICAO Code" value={airport.icao_code} mono />
          <InfoCard icon={<Globe size={16} />} label="Country" value={airport.country_name || airport.country} />
          <InfoCard icon={<MapPin size={16} />} label="City" value={airport.city || "—"} />
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <InfoCard icon={<Navigation size={16} />} label="Latitude" value={airport.latitude.toFixed(6)} mono />
          <InfoCard icon={<Navigation size={16} />} label="Longitude" value={airport.longitude.toFixed(6)} mono />
        </div>

        {/* Map embed */}
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden mb-8">
          <iframe
            src={mapsEmbedUrl}
            width="100%"
            height="320"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
        </div>

        {/* Action links */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-sm font-medium hover:bg-cyan-500/10 transition-colors"
          >
            <MapPin size={16} />
            Open in Google Maps
          </a>
          {airport.aip_source_url && (
            <a
              href={airport.aip_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 text-sm font-medium hover:bg-white/[0.06] transition-colors"
            >
              <ExternalLink size={16} />
              <span>
                View AIP Source Document
                <span className="block text-[10px] text-slate-500 font-normal">
                  Aeronautical Information Publication
                </span>
              </span>
            </a>
          )}
        </div>

        {/* Agent info */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Radio size={14} className="text-cyan-400" />
            <p className="text-[11px] font-semibold tracking-wider uppercase text-cyan-400">
              Agent Information
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoCard label="Agent Status" value={AGENT_STATUS_LABELS[agentStatus]} />
            <InfoCard label="Airport Type" value={AIRPORT_TYPE_LABELS[airportType]} />
            <InfoCard
              label="Agent Deployed"
              value={agentStatus === "none" ? "No" : "Yes"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-center gap-1.5 mb-2">
        {icon && <span className="text-slate-600">{icon}</span>}
        <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-600">
          {label}
        </p>
      </div>
      <p className={`text-base text-white font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}
