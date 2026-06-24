"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullYRef = useRef(0);
  const activeRef = useRef(false);

  const THRESHOLD = 80;

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY <= 0 && !refreshing) {
      startYRef.current = e.touches[0].clientY;
      activeRef.current = true;
    }
  }, [refreshing]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!activeRef.current || refreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0 && window.scrollY <= 0) {
      e.preventDefault();
      const dist = Math.min(delta * 0.45, 130);
      pullYRef.current = dist;
      setPullY(dist);
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    if (pullYRef.current >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(50);
      setTimeout(() => window.location.reload(), 800);
    } else {
      setPullY(0);
      pullYRef.current = 0;
    }
    startYRef.current = 0;
  }, [refreshing]);

  useEffect(() => {
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const progress = Math.min(pullY / THRESHOLD, 1);

  return (
    <>
      {/* Pull indicator — rendered outside content flow */}
      {pullY > 5 && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[90] pointer-events-none"
          style={{ top: `${Math.max(pullY - 30, 10)}px`, opacity: progress }}
        >
          <div className="w-10 h-10 rounded-full bg-[#0a0f1e] border border-white/[0.15] flex items-center justify-center shadow-2xl">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-cyan-400 ${refreshing ? "animate-spin" : ""}`}
              style={refreshing ? undefined : { transform: `rotate(${progress * 360}deg)` }}
            >
              <path d="M21 12a9 9 0 1 1-9-9" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </div>
        </div>
      )}

      {/* Page content */}
      <div
        style={{
          marginTop: pullY > 0 ? `${pullY}px` : undefined,
          transition: activeRef.current ? "none" : "margin-top 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </>
  );
}
