"use client";

import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FadeIn } from "@/components/motion/fade-in";
import { Heading } from "@/components/ui/heading";
import { GradientText } from "@/components/ui/gradient-text";
import { Badge } from "@/components/ui/badge";
import {
  StaggerChildren,
  StaggerItem,
} from "@/components/motion/stagger-children";
import {
  Layers,
  Route,
  Code2,
  Box,
  LineChart,
  Zap,
} from "lucide-react";

const roadmapItems = [
  {
    icon: Layers,
    title: "Airport OS",
    description:
      "Unified operational intelligence layer. Performance, commercial, and regulatory data in a single analytical environment.",
    status: "In Development",
  },
  {
    icon: Route,
    title: "Route Economics Simulator",
    description:
      "Model route viability, airline incentive structures, and traffic capture scenarios with airport-specific cost parameters.",
    status: "2025",
  },
  {
    icon: Code2,
    title: "API Platform",
    description:
      "Programmatic access to Airportronics data. Benchmarking metrics, charges data, and performance indicators via RESTful APIs.",
    status: "2025",
  },
  {
    icon: Zap,
    title: "Real-Time Alerting",
    description:
      "Custom alert rules for traffic thresholds, charge changes, regulatory filings, and operational disruptions across monitored airports.",
    status: "2025",
  },
  {
    icon: Box,
    title: "Digital Twin Framework",
    description:
      "Terminal capacity modeling and scenario planning. Simulate passenger flows, gate utilization, and infrastructure requirements.",
    status: "2026",
  },
  {
    icon: LineChart,
    title: "Investor Intelligence",
    description:
      "Airport transaction analytics, valuation benchmarking, regulatory risk scoring, and deal pipeline tracking for infrastructure investors.",
    status: "2026",
  },
];

/** Future ecosystem / vision section — product roadmap */
export function FutureVision() {
  return (
    <SectionWrapper id="vision">
      <FadeIn>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="accent" className="mb-6">
            <Zap className="h-3.5 w-3.5" />
            Product Roadmap
          </Badge>
          <Heading level={2} className="mb-4">
            Building the Future of{" "}
            <GradientText>Airport Intelligence</GradientText>
          </Heading>
          <p className="text-text-secondary">
            Airportronics is evolving into a comprehensive airport operating
            system. Here is what we are building next.
          </p>
        </div>
      </FadeIn>

      <StaggerChildren className="relative mt-16">
        {/* Vertical timeline line */}
        <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-accent-primary/40 via-accent-secondary/40 to-transparent lg:left-1/2 lg:block" />

        <div className="space-y-8">
          {roadmapItems.map((item, index) => (
            <StaggerItem key={item.title}>
              <div
                className={`relative flex flex-col gap-4 lg:flex-row lg:items-center ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div
                  className={`flex-1 ${
                    index % 2 === 0
                      ? "lg:pr-12 lg:text-right"
                      : "lg:pl-12"
                  }`}
                >
                  <div
                    className={`rounded-xl border border-border-default bg-surface p-6 transition-all duration-300 hover:border-border-accent hover:bg-surface-elevated ${
                      index % 2 === 0 ? "lg:ml-auto" : ""
                    } lg:max-w-md`}
                  >
                    <div
                      className={`flex items-center gap-3 ${
                        index % 2 === 0 ? "lg:flex-row-reverse" : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10">
                        <item.icon className="h-5 w-5 text-accent-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">
                          {item.title}
                        </h3>
                        <Badge variant="default" className="mt-1">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Timeline dot */}
                <div className="absolute left-4 top-6 hidden h-3 w-3 -translate-x-1/2 rounded-full border-2 border-accent-primary bg-background lg:left-1/2 lg:block" />

                {/* Spacer for the other side */}
                <div className="hidden flex-1 lg:block" />
              </div>
            </StaggerItem>
          ))}
        </div>
      </StaggerChildren>
    </SectionWrapper>
  );
}
