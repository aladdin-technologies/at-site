"use client";

import { SectionWrapper } from "@/components/layout/section-wrapper";
import { Heading } from "@/components/ui/heading";
import { GradientText } from "@/components/ui/gradient-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  StaggerChildren,
  StaggerItem,
} from "@/components/motion/stagger-children";
import {
  BarChart3,
  Activity,
  DollarSign,
  BookOpen,
  Users,
  Lightbulb,
} from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

const capabilities = [
  {
    icon: BarChart3,
    title: "Benchmarking Platform",
    description:
      "Compare airport performance across 50+ KPIs. Revenue, cost, efficiency, and service quality — normalized and indexed for meaningful comparison.",
    badge: "Core Product",
  },
  {
    icon: Activity,
    title: "Live Intelligence",
    description:
      "Real-time airport performance monitoring. Operational data, traffic trends, and early warning signals — continuously updated.",
    badge: "Real-time",
  },
  {
    icon: DollarSign,
    title: "Charges & Tariffs",
    description:
      "Comprehensive airport charges database. Landing fees, passenger charges, regulatory filings, and historical trends across global airports.",
    badge: "Database",
  },
  {
    icon: BookOpen,
    title: "Research & Books",
    description:
      "Published airport economics research. Original analysis, benchmarking reports, and the Airportronics book series on airport strategy.",
    badge: "Publishing",
  },
  {
    icon: Users,
    title: "Strategic Advisory",
    description:
      "Boutique consulting for airport operators, regulators, airlines, and investors. Tariff reviews, economic regulation, and master planning.",
    badge: "Advisory",
  },
  {
    icon: Lightbulb,
    title: "Future Intelligence",
    description:
      "Next-generation tools in development: route economics simulator, digital twin frameworks, API platform, and investor intelligence modules.",
    badge: "Roadmap",
  },
];

/** Platform capabilities section — 6 feature cards in a responsive grid */
export function PlatformPillars() {
  return (
    <SectionWrapper id="platform" alternate>
      <FadeIn>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="accent" className="mb-6">
            Platform Capabilities
          </Badge>
          <Heading level={2} className="mb-4">
            One Platform. Complete{" "}
            <GradientText>Airport Intelligence</GradientText>
          </Heading>
          <p className="text-text-secondary">
            Six integrated modules that cover the full spectrum of airport
            economics, performance, and strategy.
          </p>
        </div>
      </FadeIn>

      <StaggerChildren className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((cap) => (
          <StaggerItem key={cap.title}>
            <Card variant="glow" hover className="h-full">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-primary/10">
                  <cap.icon className="h-5 w-5 text-accent-primary" />
                </div>
                <Badge variant="default">{cap.badge}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                {cap.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {cap.description}
              </p>
            </Card>
          </StaggerItem>
        ))}
      </StaggerChildren>
    </SectionWrapper>
  );
}
