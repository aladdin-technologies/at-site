"use client";

import { usePathname } from "next/navigation";
import { AeroShell } from "@/components/aero/AeroShell";

export default function AeroLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        [data-site-header], [data-site-footer] { display: none !important; }
        main { padding: 0 !important; }
      `}</style>
      {pathname === "/aero/login" ? children : <AeroShell>{children}</AeroShell>}
    </>
  );
}
