import { Hero } from "@/components/sections/hero";
import { CredibilityStrip } from "@/components/sections/credibility-strip";
import { About } from "@/components/sections/about";
import { PlatformPillars } from "@/components/sections/platform-pillars";
import { BookSeries } from "@/components/sections/book-series";
import { Benchmarking } from "@/components/sections/benchmarking";
import { LiveIntelligence } from "@/components/sections/live-intelligence";
import { ChargesTariff } from "@/components/sections/charges-tariff";
import { Advisory } from "@/components/sections/advisory";
import { ResearchReports } from "@/components/sections/research-reports";
import { FutureVision } from "@/components/sections/future-vision";
import { EnterpriseCta } from "@/components/sections/enterprise-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CredibilityStrip />
      <About />
      <PlatformPillars />
      <BookSeries />
      <Benchmarking />
      <LiveIntelligence />
      <ChargesTariff />
      <Advisory />
      <ResearchReports />
      <FutureVision />
      <EnterpriseCta />
    </>
  );
}
