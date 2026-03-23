"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface CountUpProps {
  value: string;
  duration?: number;
}

/** Animated number counter that triggers when element scrolls into view */
export function CountUp({ value, duration = 1.5 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    // Extract numeric part
    const numericStr = value.replace(/[^0-9.]/g, "");
    const target = parseFloat(numericStr);
    if (isNaN(target)) {
      setDisplay(value);
      return;
    }

    const prefix = value.match(/^[^0-9]*/)?.[0] ?? "";
    const suffix = value.match(/[^0-9.]*$/)?.[0] ?? "";
    const hasDecimal = numericStr.includes(".");
    const decimalPlaces = hasDecimal ? numericStr.split(".")[1]?.length ?? 0 : 0;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      if (hasDecimal) {
        setDisplay(
          `${prefix}${current.toFixed(decimalPlaces)}${suffix}`
        );
      } else {
        // Reinsert commas if the original value had them
        const formatted = Math.round(current).toLocaleString();
        setDisplay(`${prefix}${formatted}${suffix}`);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{display}</span>;
}
