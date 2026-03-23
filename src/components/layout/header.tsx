"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/lib/site-config";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/cn";
import { Menu } from "lucide-react";

/** Sticky header with nav links, theme toggle, and CTA */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-b border-border-default bg-background/80 backdrop-blur-xl"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-accent-primary"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-bold text-text-primary">
              Airportronics
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 lg:flex">
            {siteConfig.nav.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden sm:flex" />
            <Button size="sm" className="hidden sm:inline-flex">
              Request Access
            </Button>
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-elevated lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
