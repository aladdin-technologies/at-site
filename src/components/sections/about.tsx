"use client";

import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FadeIn } from "@/components/motion/fade-in";
import { Heading } from "@/components/ui/heading";
import { GradientText } from "@/components/ui/gradient-text";
import { Badge } from "@/components/ui/badge";
import { Globe, Database, TrendingUp, Shield } from "lucide-react";

const pillars = [
  { icon: Globe, label: "Global Coverage" },
  { icon: Database, label: "Deep Data" },
  { icon: TrendingUp, label: "Strategic Insight" },
  { icon: Shield, label: "Enterprise Grade" },
];

/** About section — company narrative with four capability pillars */
export function About() {
  return (
    <SectionWrapper id="about">
      <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
        {/* Narrative */}
        <FadeIn direction="left">
          <Badge variant="accent" className="mb-6">
            About Airportronics
          </Badge>
          <Heading level={2} className="mb-6">
            Where Airport Economics Meets{" "}
            <GradientText>Intelligence</GradientText>
          </Heading>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            <p>
              Airportronics is a global airport intelligence and strategy
              platform designed for professionals who shape the future of
              aviation infrastructure.
            </p>
            <p>
              We combine rigorous benchmarking methodology, real-time
              performance data, charges intelligence, and strategic advisory
              into a single, authoritative platform — built by airport
              economists, for airport decision-makers.
            </p>
            <p>
              From published research to live analytics, Airportronics
              provides the depth of insight that airport executives,
              regulators, airlines, and investors need to make
              high-confidence decisions.
            </p>
          </div>
        </FadeIn>

        {/* Visual element */}
        <FadeIn direction="right">
          <div className="grid grid-cols-2 gap-4">
            {pillars.map((pillar) => (
              <div
                key={pillar.label}
                className="flex flex-col items-center gap-3 rounded-xl border border-border-default bg-surface p-6 text-center transition-all duration-300 hover:border-border-accent hover:bg-surface-elevated"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-primary/10">
                  <pillar.icon className="h-6 w-6 text-accent-primary" />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {pillar.label}
                </span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </SectionWrapper>
  );
}
