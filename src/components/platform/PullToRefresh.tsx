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
      {/* iOS-style pull indicator */}
      {pullY > 5 && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[90] pointer-events-none"
          style={{ top: `${Math.max(pullY - 30, 10)}px`, opacity: progress }}
        >
          <div className="w-8 h-8 flex items-center justify-center">
            {refreshing ? (
              <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
                <path fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" style={{ transform: `rotate(${progress * 270}deg)` }}>
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="none" />
                <circle
                  cx="12" cy="12" r="10"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 63} 63`}
                />
              </svg>
            )}
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
