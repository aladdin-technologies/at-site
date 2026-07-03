"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ForecastLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data } = await supabase
      .from("forecast_users")
      .select("id, email, name, role, company_id")
      .eq("email", email.toLowerCase().trim())
      .eq("password_hash", password)
      .single();

    if (!data) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    sessionStorage.setItem("forecast-user", JSON.stringify(data));
    sessionStorage.setItem("at-portal-auth", "1");
    router.push("/platform/DAdemo/enterprise-access/portal/forecast");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/icon-192.png" alt="" className="w-12 h-12 rounded-xl mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">AIRPORTRONICS</h1>
          <p className="text-sm text-gray-500 mt-1">Aeronautical Revenue Forecasting</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@airportronics.com"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={!email || !password || loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Don&apos;t have an account? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
