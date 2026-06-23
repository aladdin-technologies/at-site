"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  decimals = 2,
  duration = 800,
  className = "",
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    cancelAnimationFrame(animRef.current);
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * ease;
      setDisplay(current);
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, duration]);

  return (
    <span className={className}>
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
