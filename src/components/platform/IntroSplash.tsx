"use client";

import { useEffect, useState, useRef } from "react";

export function IntroSplash({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"video" | "fadeout">("video");
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Progress bar animation
    const duration = 4500;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      setProgress(t * 100);
      if (t < 1) requestAnimationFrame(tick);
      else {
        setPhase("fadeout");
        setTimeout(onComplete, 600);
      }
    }
    requestAnimationFrame(tick);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${phase === "fadeout" ? "opacity-0" : "opacity-100"}`}
    >
      {/* Video background */}
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content — floating animation */}
      <div className="relative z-10 text-center px-6 animate-[float_3s_ease-in-out_infinite]">
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-cyan-400"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wide mb-2">
          AIRPORTRONICS
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          Airport Asset & Revenue Intelligence System
        </p>

        {/* Loading indicator */}
        <div className="max-w-xs mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-cyan-400 font-medium">
              {progress < 30
                ? "Initializing system..."
                : progress < 60
                  ? "Connecting to agents..."
                  : progress < 90
                    ? "Loading intelligence data..."
                    : "Launching platform..."}
            </span>
            <span className="text-[11px] text-slate-600 font-mono">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/20 overflow-hidden shadow-[0_0_10px_rgba(34,211,238,0.3)]">
            <div
              className="h-full rounded-full transition-all duration-100 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #0891b2, #22d3ee, #ffffff, #22d3ee, #0891b2)",
                backgroundSize: "200% 100%",
                animation: "barGlow 1s linear infinite",
              }}
            />
          </div>
          <style>{`
            @keyframes barGlow {
              0% { background-position: 0% 0; }
              100% { background-position: 200% 0; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
