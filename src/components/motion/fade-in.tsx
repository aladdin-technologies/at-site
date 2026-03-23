"use client";

import { motion } from "framer-motion";
import { viewportConfig } from "@/lib/motion-variants";
import { cn } from "@/lib/cn";

type Direction = "up" | "down" | "left" | "right" | "none";

interface FadeInProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
}

const offsets: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: -40 },
  right: { x: 40 },
  none: {},
};

/** Scroll-triggered fade-in animation wrapper with configurable direction */
export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className,
}: FadeInProps) {
  const offset = offsets[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={viewportConfig}
      transition={{ duration, delay, ease: "easeOut" }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
