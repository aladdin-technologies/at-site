"use client";

import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FadeIn } from "@/components/motion/fade-in";

const associations = [
  "IATA", "ACI", "ICAO", "Eurocontrol", "FAA", "EASA",
];

/** Credibility strip — displays industry association names and positioning statement */
export function CredibilityStrip() {
  return (
    <SectionWrapper className="!py-16 border-y border-border-default bg-surface-secondary">
      <FadeIn>
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.2em] text-text-tertiary">
          Built on methodologies aligned with global aviation standards
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {associations.map((name) => (
            <span
              key={name}
              className="font-mono text-sm font-medium text-text-tertiary/60 transition-colors hover:text-text-secondary"
            >
              {name}
            </span>
          ))}
        </div>
      </FadeIn>
    </SectionWrapper>
  );
}
