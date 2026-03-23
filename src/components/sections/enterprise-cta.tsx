"use client";

import { FadeIn } from "@/components/motion/fade-in";
import { Heading } from "@/components/ui/heading";
import { GradientText } from "@/components/ui/gradient-text";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";

/** Final CTA section — enterprise contact with gradient backdrop */
export function EnterpriseCta() {
  return (
    <section id="contact" className="relative overflow-hidden py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-background to-accent-secondary/5" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />

      {/* Radial glow */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">
        <FadeIn>
          <Heading level={2} className="mb-6">
            Ready to Transform Your{" "}
            <GradientText>Airport Intelligence?</GradientText>
          </Heading>
          <p className="mx-auto max-w-xl text-lg text-text-secondary">
            Join leading airports, airlines, and investors who rely on
            Airportronics for benchmarking, analytics, and strategic insight.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="premium">
              Request Enterprise Access
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="secondary">
              <Mail className="h-4 w-4" />
              Contact Us
            </Button>
          </div>
          <p className="mt-8 text-sm text-text-tertiary">
            Tailored onboarding for enterprise teams. Custom data packages
            and advisory engagements available.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
