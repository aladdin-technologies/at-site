"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IntroSplash } from "@/components/platform/IntroSplash";

export default function AccessPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const handleSplashComplete = useCallback(() => {
    router.push("/platform/DAdemo/enterprise-access/portal/dashboard");
  }, [router]);

  useEffect(() => {
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    if (header) header.style.display = "none";
    if (footer) footer.style.display = "none";
    return () => {
      if (header) header.style.display = "";
      if (footer) footer.style.display = "";
    };
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    setError(false);
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 3) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      setCode(pasted.split(""));
      document.getElementById("code-3")?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.some((d) => !d)) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    if (code.join("") === "2026") {
      sessionStorage.setItem("at-portal-auth", "1");
      setShowSplash(true);
      return;
    }
    setLoading(false);
    setError(true);
    setCode(["", "", "", ""]);
    document.getElementById("code-0")?.focus();
  }

  const filled = code.every((d) => d !== "");

  if (showSplash) {
    return <IntroSplash onComplete={handleSplashComplete} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-[#060a14]">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.05),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,211,238,0.03),transparent_40%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Orbital ring animation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[700px] sm:h-[700px]">
        <div
          className="absolute inset-0 rounded-full border border-cyan-500/[0.07]"
          style={{ animation: "spin 60s linear infinite" }}
        />
        <div
          className="absolute inset-8 rounded-full border border-indigo-500/[0.05]"
          style={{ animation: "spin 45s linear infinite reverse" }}
        />
        <div
          className="absolute inset-16 rounded-full border border-cyan-500/[0.04]"
          style={{ animation: "spin 90s linear infinite" }}
        />
      </div>

      {/* Access card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-wide text-white">
              AIRPORTRONICS
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Airport Asset &amp; Revenue Intelligence System
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8">
          <p className="text-center text-sm text-slate-400 mb-6">
            Enter your access code
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  id={`code-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={[
                    "w-16 h-20 text-center text-3xl font-mono font-bold rounded-xl border-2 bg-white/[0.03] text-white outline-none transition-all duration-200",
                    error
                      ? "border-red-500/60 animate-[shake_0.4s_ease-in-out]"
                      : "border-white/[0.08] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
                  ].join(" ")}
                  autoFocus={i === 0}
                  autoComplete="off"
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Invalid access code
              </div>
            )}

            <button
              type="submit"
              disabled={!filled || loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-cyan-500 text-white hover:bg-cyan-400 active:scale-[0.98]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Verifying&hellip;
                </span>
              ) : (
                "Enter Intelligence System"
              )}
            </button>
          </form>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
