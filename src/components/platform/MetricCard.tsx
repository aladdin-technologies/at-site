"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        function tick(now: number) {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setValue(Math.round(target * ease));
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return { value, ref };
}

export function MetricCard({
  title,
  value,
  suffix = "",
  subtitle,
  href,
}: {
  title: string;
  value: number;
  suffix?: string;
  subtitle?: string;
  href?: string;
}) {
  const counter = useCountUp(value);

  return (
    <div
      ref={counter.ref}
      className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4 overflow-hidden hover:border-cyan-500/20 hover:bg-white/[0.05] transition-all duration-300 ${href ? "cursor-pointer" : ""}`}
    >
      {href && <a href={href} className="absolute inset-0 z-10" />}
      <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 mb-2 line-clamp-2">
        {title}
      </p>
      <p className="text-xl font-bold text-white font-mono tabular-nums truncate">
        {counter.value.toLocaleString()}
        {suffix}
      </p>
      {subtitle && (
        <p className="text-[11px] text-slate-500 mt-1 truncate">{subtitle}</p>
      )}
    </div>
  );
}
