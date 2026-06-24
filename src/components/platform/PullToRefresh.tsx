"use client";

import { useEffect, useRef, useState } from "react";

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 80;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        setPulling(true);
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!startY.current || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && window.scrollY === 0) {
        e.preventDefault();
        setPullDistance(Math.min(delta * 0.5, 120));
      }
    }

    function onTouchEnd() {
      if (pullDistance >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPullDistance(50);
        setTimeout(() => {
          window.location.reload();
        }, 600);
      } else {
        setPullDistance(0);
      }
      setPulling(false);
      startY.current = 0;
    }

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  });

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[90] transition-all duration-200"
        style={{
          top: Math.max(pullDistance - 40, -40),
          opacity: pullDistance > 10 ? Math.min(pullDistance / THRESHOLD, 1) : 0,
        }}
      >
        <div
          className={`w-10 h-10 rounded-full bg-[#0a0f1e] border border-white/[0.1] flex items-center justify-center shadow-lg ${refreshing ? "" : ""}`}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-cyan-400 transition-transform duration-200 ${refreshing ? "animate-spin" : ""}`}
            style={{
              transform: refreshing ? undefined : `rotate(${Math.min((pullDistance / THRESHOLD) * 360, 360)}deg)`,
            }}
          >
            <path d="M21 12a9 9 0 1 1-9-9" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
        </div>
      </div>

      {/* Content with pull offset — use margin not transform to avoid breaking fixed positioning */}
      <div
        style={{
          marginTop: pullDistance > 0 ? `${pullDistance}px` : undefined,
          transition: pulling ? "none" : "margin-top 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
