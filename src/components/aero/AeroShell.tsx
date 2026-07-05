"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAeroCurrency } from "@/lib/useAeroCurrency";
import { usePermissions, type TabPermissions } from "@/lib/usePermissions";
import {
  LayoutDashboard,
  History,
  BarChart3,
  TrendingUp,
  Target,
  Receipt,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Bell,
  HelpCircle,
  User,
  CreditCard,
  Shield,
  ChevronDown,
} from "lucide-react";

const NAV_ITEMS: { label: string; href: string; icon: any; permKey: keyof TabPermissions }[] = [
  { label: "Dashboard", href: "/aero", icon: LayoutDashboard, permKey: "dashboard" },
  { label: "Analytics", href: "/aero/analytics", icon: BarChart3, permKey: "analytics" },
  { label: "Historicals", href: "/aero/historicals", icon: History, permKey: "historicals" },
  { label: "Budget", href: "/aero/budget", icon: Target, permKey: "budget" },
  { label: "Scenarios", href: "/aero/scenarios", icon: TrendingUp, permKey: "scenarios" },
  { label: "Yield & Charges", href: "/aero/charges", icon: Receipt, permKey: "charges" },
  { label: "Revenue Lines", href: "/aero/revenue", icon: DollarSign, permKey: "revenue" },
  { label: "Benchmarking", href: "/aero/benchmarking", icon: BarChart3, permKey: "analytics" },
  { label: "Settings", href: "/aero/settings", icon: Settings, permKey: "settings" },
];

export function AeroShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState("Demo User");
  const [userEmail, setUserEmail] = useState("demo@airportronics.com");
  const aeroCurrency = useAeroCurrency();
  const { canView } = usePermissions();

  const visibleNav = NAV_ITEMS.filter(item => canView(item.permKey));

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/aero/login");
      return;
    }
    setAuthorized(true);
    try {
      const stored = JSON.parse(sessionStorage.getItem("forecast-user") || "{}");
      if (stored.name) setUserName(stored.name);
      if (stored.email) setUserEmail(stored.email);
    } catch {}
  }, [router]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

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
          collapsed ? "w-14" : "w-48"
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
          {visibleNav.map((item) => {
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

          {/* Currency badge */}
          <a
            href="/aero/settings"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
            title="Base currency — change in Settings"
          >
            <span className="text-[11px] font-mono font-semibold text-gray-700">{aeroCurrency}</span>
          </a>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell size={18} className="text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
          </button>

          {/* Help */}
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <HelpCircle size={18} className="text-gray-500" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* User avatar + dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-900 leading-tight">{userName}</p>
                <p className="text-[10px] text-gray-400 leading-tight">Admin</p>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-gray-200 shadow-lg shadow-black/8 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push("/aero/settings"); }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={16} className="text-gray-400" />
                    Profile & Account
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push("/aero/settings"); }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" />
                    Settings
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push("/aero/settings?tab=team"); }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Shield size={16} className="text-gray-400" />
                    Team & Permissions
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <CreditCard size={16} className="text-gray-400" />
                    Billing & Plan
                  </button>
                </div>

                {/* Workspace info */}
                <div className="border-t border-gray-100 px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Workspace</p>
                      <p className="text-xs text-gray-600 font-medium">Global Aviation Group</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">Pro</span>
                  </div>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
