"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/ui/gradient-text";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";

/** Hero section — cinematic entry with animated gradient background */
export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[var(--hero-gradient)] animate-gradient" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      {/* Radial glow accent */}
      <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary/5 blur-[120px]" />
      <div className="absolute right-1/4 top-2/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-secondary/5 blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Badge variant="accent" className="mb-8">
            Global Airport Intelligence Platform
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="mx-auto max-w-5xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl"
        >
          The Intelligence Layer for{" "}
          <GradientText>Global Airports</GradientText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl"
        >
          Benchmarking, performance analytics, charges intelligence, and
          strategic advisory — built for airport executives, airlines,
          regulators, and infrastructure investors.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button size="lg">
            Explore the Platform
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="lg">
            View Research
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4"
        >
          {[
            { value: "2,847", label: "Airports" },
            { value: "194", label: "Countries" },
            { value: "14.2M", label: "Data Points/mo" },
            { value: "50+", label: "KPIs Tracked" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-mono text-2xl font-bold text-text-primary sm:text-3xl">
                <CountUp value={stat.value} />
              </div>
              <div className="mt-1 text-sm text-text-tertiary">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-6 w-6 text-text-tertiary" />
        </motion.div>
      </motion.div>
    </section>
  );
}
