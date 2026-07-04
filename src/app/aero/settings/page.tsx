"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, Users, Save, Plus, Trash2, Mail } from "lucide-react";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"general" | "team">("general");

  useEffect(() => {
    if (searchParams.get("tab") === "team") setTab("team");
  }, [searchParams]);
  const [inflation, setInflation] = useState("3.0");
  const [yieldGrowth, setYieldGrowth] = useState("2.5");
  const [trafficGrowth, setTrafficGrowth] = useState("5.0");
  const [currency, setCurrency] = useState("USD");
  const [fiscalStart, setFiscalStart] = useState("January");
  const [saved, setSaved] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [teamMembers] = useState([
    { name: "Demo User", email: "demo@airportronics.com", role: "Admin", joined: "Jun 2025" },
    { name: "Sarah Chen", email: "sarah.chen@example.com", role: "Analyst", joined: "Jul 2025" },
    { name: "James Wright", email: "j.wright@example.com", role: "Viewer", joined: "Aug 2025" },
  ]);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your forecasting parameters and team</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab("general")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "general" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Settings size={16} /> General
        </button>
        <button
          onClick={() => setTab("team")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "team" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users size={16} /> Team
        </button>
      </div>

      {tab === "general" && (
        <div className="space-y-6">
          {/* Forecast Parameters */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Forecast Parameters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Inflation Rate (%)</label>
                <input type="number" step="0.1" value={inflation} onChange={(e) => setInflation(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Yield Growth Rate (%)</label>
                <input type="number" step="0.1" value={yieldGrowth} onChange={(e) => setYieldGrowth(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Traffic Growth Rate (%)</label>
                <input type="number" step="0.1" value={trafficGrowth} onChange={(e) => setTrafficGrowth(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Base Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>AED</option>
                  <option>SGD</option>
                  <option>JPY</option>
                </select>
              </div>
            </div>
          </div>

          {/* Financial Year */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Financial Year</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fiscal Year Starts</label>
                <select value={fiscalStart} onChange={(e) => setFiscalStart(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500">
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            <Save size={16} />
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      )}

      {tab === "team" && (
        <div className="space-y-6">
          {/* Invite */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Invite Team Member</h2>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              <select className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none">
                <option>Analyst</option>
                <option>Viewer</option>
                <option>Admin</option>
              </select>
              <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                <Plus size={16} /> Invite
              </button>
            </div>
          </div>

          {/* Team list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Joined</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((m) => (
                  <tr key={m.email} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        m.role === "Admin" ? "bg-blue-50 text-blue-700" :
                        m.role === "Analyst" ? "bg-emerald-50 text-emerald-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{m.joined}</td>
                    <td className="px-4 py-3">
                      {m.role !== "Admin" && (
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
