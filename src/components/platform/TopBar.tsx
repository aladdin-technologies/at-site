"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Radio, X, LogOut } from "lucide-react";
import { CurrencyPicker } from "./CurrencyPicker";
import { AircraftPicker } from "./AircraftPicker";

const NAV_ITEMS = [
  { label: "Home", href: "/platform/DAdemo/enterprise-access/portal/dashboard", active: true },
  { label: "Revenue Intelligence", href: "/platform/DAdemo/enterprise-access/portal/revenue" },
  { label: "Asset Intelligence", href: "#", coming: true },
  { label: "Economics Intelligence", href: "#", coming: true },
  { label: "Charges Database", href: "#", coming: true },
];

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const showCurrency = pathname?.includes("/revenue") === true;

  function handleLogout() {
    sessionStorage.removeItem("at-portal-auth");
    router.push("/platform/DAdemo/enterprise-access/portal/verify");
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#060a14]/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
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
              <span className="text-sm font-bold tracking-wide text-white">
                AIRPORTRONICS
              </span>
            </div>
            <span className="hidden sm:block text-[11px] text-slate-600 font-medium border-l border-white/[0.08] pl-3 ml-1">
              Airport Asset &amp; Revenue Intelligence System
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/platform/DAdemo/enterprise-access/portal/agents"
              className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
            >
              <Radio size={12} className="animate-pulse" />
              Global agents online
            </a>
            {showCurrency && <AircraftPicker />}
            {showCurrency && <CurrencyPicker />}
            <button
              onClick={() => setOpen(true)}
              className="flex flex-col justify-center items-center gap-[5px] w-9 h-9 rounded-lg hover:bg-white/[0.06] transition-colors"
              aria-label="Open menu"
            >
              <span className="block w-5 h-[2px] bg-slate-400 rounded-full transition-all" />
              <span className="block w-4 h-[2px] bg-slate-400 rounded-full transition-all" />
              <span className="block w-5 h-[2px] bg-slate-400 rounded-full transition-all" />
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <nav
        className={`fixed top-0 right-0 z-[70] h-full w-80 max-w-[85vw] bg-[#080d1a] border-l border-white/[0.06] shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between h-14 px-6 border-b border-white/[0.06]">
          <span className="text-sm font-bold tracking-wide text-white">
            AIRPORTRONICS
          </span>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            aria-label="Close menu"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="px-4 py-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                item.active
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {item.label}
              {item.coming && (
                <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-500">
                  Soon
                </span>
              )}
            </a>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-6 py-6 border-t border-white/[0.06]">
          <a
            href="/platform/DAdemo/enterprise-access/portal/agents"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mb-6 hover:text-emerald-300 transition-colors"
          >
            <Radio size={12} className="animate-pulse" />
            Global agents online
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </nav>
    </>
  );
}
