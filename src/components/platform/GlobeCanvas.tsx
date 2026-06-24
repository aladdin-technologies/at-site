"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import {
  AIRPORT_TYPE_COLORS,
  AIRPORT_TYPE_RING_COLORS,
  AIRPORT_TYPE_LABELS,
  type AirportRow,
  type AirportType,
} from "@/lib/supabase";
import { useAirports } from "@/lib/useAirports";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export function GlobeCanvas() {
  const globeRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const { airports, stats } = useAirports();
  const [selected, setSelected] = useState<AirportRow | null>(null);
  const [containerWidth, setContainerWidth] = useState(560);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setContainerWidth(Math.min(containerRef.current.offsetWidth, 620));
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!globeRef.current || !ready) return;
    const globe = globeRef.current;
    const controls = globe.controls();
    controls.enableZoom = true;
    controls.minDistance = 120;
    controls.maxDistance = 600;
    controls.zoomSpeed = 0.8;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    globe.pointOfView({ lat: 20, lng: 30, altitude: 1.8 });
  }, [ready]);

  const pointsData = useMemo(
    () =>
      airports.map((a) => ({
        lat: a.latitude,
        lng: a.longitude,
        size: a.airportType === "international" ? 0.25 : 0.15,
        color: AIRPORT_TYPE_COLORS[a.airportType],
        airport: a,
      })),
    [airports],
  );

  const ringsData = useMemo(
    () =>
      airports.map((a, i) => ({
        lat: a.latitude,
        lng: a.longitude,
        maxR: a.airportType === "international" ? 2 : 1.2,
        propagationSpeed: 1.2 + (i % 5) * 0.3,
        repeatPeriod: 1000 + (i % 7) * 200,
        color: AIRPORT_TYPE_RING_COLORS[a.airportType],
      })),
    [airports],
  );

  const handlePointClick = useCallback((point: any) => {
    if (point?.airport) {
      setSelected(point.airport);
      if (globeRef.current) {
        globeRef.current.pointOfView(
          { lat: point.airport.latitude, lng: point.airport.longitude, altitude: 1.5 },
          800,
        );
      }
    }
  }, []);

  const globeSize = Math.min(containerWidth, 560);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative w-full flex justify-center"
        style={{ height: globeSize }}
      >
        <Globe
          ref={globeRef}
          onGlobeReady={() => setReady(true)}
          onGlobeClick={() => setSelected(null)}
          width={globeSize}
          height={globeSize}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="#3b82f6"
          atmosphereAltitude={0.18}
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointRadius="size"
          pointColor="color"
          pointAltitude={0}
          onPointClick={handlePointClick}
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          ringColor="color"
        />

        {selected && (
          <div className="absolute top-4 right-4 z-30 w-72 rounded-xl border border-white/[0.1] bg-[#0a0f1e]/95 backdrop-blur-xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-bold text-sm">
                  {selected.name}{" "}
                  {selected.iata_code && (
                    <span className="text-cyan-400 font-mono text-xs ml-1">
                      {selected.iata_code}
                    </span>
                  )}
                </p>
                <p className="text-slate-500 text-[11px]">
                  {selected.city && `${selected.city}, `}
                  {selected.country}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-500 hover:text-white transition-colors text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: AIRPORT_TYPE_COLORS[selected.airportType] }}
              />
              <span className="text-[11px] text-slate-400">
                {AIRPORT_TYPE_LABELS[selected.airportType]}
              </span>
              <span className="text-[11px] text-slate-600 font-mono ml-auto">
                {selected.icao_code}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/[0.04] p-2 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Latitude</p>
                <p className="text-white font-mono text-xs">{selected.latitude.toFixed(4)}</p>
              </div>
              <div className="rounded-lg bg-white/[0.04] p-2 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Longitude</p>
                <p className="text-white font-mono text-xs">{selected.longitude.toFixed(4)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {stats.total > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 px-4">
          {(Object.keys(AIRPORT_TYPE_COLORS) as AirportType[]).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: AIRPORT_TYPE_COLORS[type] }}
              />
              <span className="text-[11px] text-slate-400">
                {AIRPORT_TYPE_LABELS[type]}
              </span>
              <span className="text-[10px] text-slate-600 font-mono">
                {stats[type].toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
