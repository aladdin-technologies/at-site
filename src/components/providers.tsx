"use client";

import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";

/** App-level providers: theme management and motion config */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  );
}
