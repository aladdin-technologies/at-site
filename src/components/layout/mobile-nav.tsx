"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

/** Full-screen mobile navigation overlay */
export function MobileNav({ open, onClose }: MobileNavProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl lg:hidden"
        >
          <div className="flex h-16 items-center justify-between px-6">
            <span className="text-lg font-bold text-text-primary">
              Airportronics
            </span>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-elevated"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-6 pt-8">
            {siteConfig.nav.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="rounded-lg px-4 py-3 text-lg font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 px-6 pt-8">
            <ThemeToggle />
            <Button className="flex-1" onClick={onClose}>
              Request Access
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
