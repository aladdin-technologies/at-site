"use client";

import { usePathname } from "next/navigation";
import { AeroShell } from "@/components/aero/AeroShell";

export default function AeroLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page gets no shell
  if (pathname === "/aero/login") {
    return <>{children}</>;
  }

  return <AeroShell>{children}</AeroShell>;
}
