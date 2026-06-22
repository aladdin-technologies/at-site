"use client";

import { useState, useEffect } from "react";

export default function VerifyPage() {
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const el = document.getElementById(`code-${index + 1}`);
      el?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const el = document.getElementById(`code-${index - 1}`);
      el?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      setCode(pasted.split(""));
      const el = document.getElementById("code-3");
      el?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.some((d) => !d)) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setError(true);
    setCode(["", "", "", ""]);
    document.getElementById("code-0")?.focus();
  }

  const filled = code.every((d) => d !== "");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-wider uppercase text-text-secondary">
              Airportronics
            </span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Secure Access Verification
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Enter the 4-digit access code provided to you to continue to the enterprise portal.
          </p>
        </div>

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
                  "w-16 h-20 text-center text-3xl font-mono font-bold rounded-xl border-2 bg-surface text-text-primary outline-none transition-all duration-200",
                  error
                    ? "border-accent-danger/60 animate-[shake_0.4s_ease-in-out]"
                    : "border-border-default focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20",
                ].join(" ")}
                autoFocus={i === 0}
                autoComplete="off"
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-accent-danger text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Invalid access code. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={!filled || loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-accent-primary text-white hover:brightness-110 active:scale-[0.98]"
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
              "Verify Access"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
