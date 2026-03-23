import { cn } from "@/lib/cn";

/** Horizontal divider with subtle gradient accent */
export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-px w-full bg-gradient-to-r from-transparent via-border-default to-transparent",
        className
      )}
    />
  );
}
