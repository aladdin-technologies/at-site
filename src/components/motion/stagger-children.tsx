"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeInUp, viewportConfig } from "@/lib/motion-variants";
import { cn } from "@/lib/cn";

interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
}

/** Parent wrapper that staggers child FadeInItem animations */
export function StaggerChildren({ children, className }: StaggerChildrenProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

/** Individual child item within a StaggerChildren parent */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeInUp} className={cn(className)}>
      {children}
    </motion.div>
  );
}
