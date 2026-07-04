"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  BarChart3,
  TrendingUp,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/aero", icon: LayoutDashboard },
  { label: "Analytics", href: "/aero/analytics", icon: BarChart3 },
  { label: "Historicals", href: "/aero/historicals", icon: History },
  { label: "Budget", href: "/aero/budget", icon: Target },
  { label: "Forecast", href: "/aero/scenarios", icon: TrendingUp },
  { label: "Settings", href: "/aero/settings", icon: Settings },
];

export function AeroShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/aero/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("at-portal-auth");
    sessionStorage.removeItem("forecast-user");
    router.push("/aero/login");
  }

  if (!authorized) return null;

  const isActive = (href: string) => {
    if (href === "/aero") return pathname === "/aero";
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-50 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-56"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className={`h-14 flex items-center border-b border-gray-100 ${collapsed ? "justify-center px-2" : "px-4 gap-2.5"}`}>
          <img src="/icon-192.png" alt="" className="w-8 h-8 rounded-lg shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">AIRPORTRONICS</p>
              <p className="text-[9px] text-gray-400 truncate">Airport Intelligence</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg transition-colors ${
                  collapsed ? "justify-center p-2.5" : "px-3 py-2.5"
                } ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} className={active ? "text-blue-600" : "text-gray-400"} />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-100 p-2">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ${
              collapsed ? "justify-center p-2.5" : "px-3 py-2.5"
            }`}
            title={collapsed ? "Log out" : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm font-medium">Log out</span>}
          </button>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex items-center w-full mt-1 p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ${collapsed ? "justify-center" : "gap-2"}`}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-[11px]">Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="flex-1" />
          <span className="text-[11px] text-gray-400 font-medium">
            Aeronautical Revenue
          </span>
        </header>

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
