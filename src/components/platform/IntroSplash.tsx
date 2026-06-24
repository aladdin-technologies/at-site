"use client";

import { useEffect, useState } from "react";

const PHASES = [
  "Initializing system...",
  "Connecting to agents...",
  "Loading intelligence data...",
  "Launching platform...",
];

export function IntroSplash({ onComplete }: { onComplete: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhaseIndex((prev) => Math.min(prev + 1, PHASES.length - 1));
    }, 1200);

    const completeTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 600);
    }, 4500);

    return () => {
      clearInterval(phaseTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      {/* Video background */}
      <video
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Logo */}
        <img src="/icon-192.png" alt="" className="w-14 h-14 rounded-2xl mb-8" />

        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wide mb-2">
          AIRPORTRONICS
        </h1>
        <p className="text-slate-400 text-sm mb-10">
          Airport Asset & Revenue Intelligence System
        </p>

        {/* Spinner — same pattern as GoVoyage */}
        <div className="mb-4">
          <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
          </svg>
        </div>

        {/* Status text */}
        <p className="text-white/85 text-sm font-medium min-h-[20px]">
          {PHASES[phaseIndex]}
        </p>
      </div>
    </div>
  );
}
