"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/platform/TopBar";
import { GlobeHero } from "@/components/platform/GlobeHero";
import { IntelligenceCard } from "@/components/platform/IntelligenceCard";

export default function DashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/platform/DAdemo/enterprise-access/portal/verify");
      return;
    }
    setAuthorized(true);
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    if (header) header.style.display = "none";
    if (footer) footer.style.display = "none";
    return () => {
      if (header) header.style.display = "";
      if (footer) footer.style.display = "";
    };
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background dark:bg-[#060a14] text-white">
      <TopBar />
      <GlobeHero />

      <section className="max-w-[1400px] mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <IntelligenceCard
            variant="revenue"
            title="Revenue Intelligence"
            description="Benchmark airport revenue lines, charge structures and commercial income streams."
            status="Live"
            href="/platform/DAdemo/enterprise-access/portal/revenue"
          />
          <IntelligenceCard
            variant="asset"
            title="Asset Intelligence"
            description="Benchmark airport assets, contracts, vendors, cost drivers and operational KPIs."
            status="Coming next"
          />
          <IntelligenceCard
            variant="economics"
            title="Economics Intelligence"
            description="Convert airport data into cost, revenue, profitability and economic impact metrics."
            status="Coming next"
          />
        </div>
      </section>
    </div>
  );
}
