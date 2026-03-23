"use client";

import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FadeIn } from "@/components/motion/fade-in";
import { Heading } from "@/components/ui/heading";
import { GradientText } from "@/components/ui/gradient-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  StaggerChildren,
  StaggerItem,
} from "@/components/motion/stagger-children";
import {
  Briefcase,
  Scale,
  Target,
  PieChart,
  ArrowRight,
} from "lucide-react";

const services = [
  {
    icon: Scale,
    title: "Economic Regulation",
    description:
      "Tariff review support, regulatory submissions, price cap modeling, and consultation responses for airports and regulators.",
  },
  {
    icon: Target,
    title: "Strategic Benchmarking",
    description:
      "Custom peer group analysis, KPI deep-dives, and executive dashboards tailored to your airport's competitive context.",
  },
  {
    icon: PieChart,
    title: "Revenue Strategy",
    description:
      "Aeronautical and commercial revenue optimization. Charges structure design, traffic forecasting, and financial modeling.",
  },
  {
    icon: Briefcase,
    title: "Investment Advisory",
    description:
      "Due diligence support for airport transactions. Market sizing, competitive assessment, and regulatory risk analysis.",
  },
];

/** Advisory services — boutique consulting positioning */
export function Advisory() {
  return (
    <SectionWrapper id="advisory">
      <FadeIn>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="premium" className="mb-6">
            <Briefcase className="h-3.5 w-3.5" />
            Strategic Advisory
          </Badge>
          <Heading level={2} className="mb-4">
            Expert-Led Airport{" "}
            <GradientText from="from-accent-warm" to="to-yellow-400">
              Strategy
            </GradientText>
          </Heading>
          <p className="text-text-secondary">
            Boutique advisory services for airport operators, regulators,
            airlines, and infrastructure investors. Deep domain expertise
            combined with rigorous analytical methodology.
          </p>
        </div>
      </FadeIn>

      <StaggerChildren className="mt-16 grid gap-6 sm:grid-cols-2">
        {services.map((service) => (
          <StaggerItem key={service.title}>
            <div className="group rounded-xl border border-border-default bg-surface p-8 transition-all duration-300 hover:border-border-accent hover:bg-surface-elevated">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-warm/10">
                <service.icon className="h-6 w-6 text-accent-warm" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-text-primary">
                {service.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {service.description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerChildren>

      <FadeIn className="mt-12 text-center">
        <Button variant="premium" size="lg">
          Discuss Your Needs
          <ArrowRight className="h-4 w-4" />
        </Button>
      </FadeIn>
    </SectionWrapper>
  );
}
