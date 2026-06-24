"use client";

import { PullToRefresh } from "@/components/platform/PullToRefresh";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        [data-site-header], [data-site-footer] { display: none !important; }
        main { padding: 0 !important; }
      `}</style>
      <PullToRefresh>{children}</PullToRefresh>
    </>
  );
}
