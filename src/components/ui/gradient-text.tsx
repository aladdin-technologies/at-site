import { cn } from "@/lib/cn";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  to?: string;
}

/** Text with a gradient color fill effect */
export function GradientText({
  children,
  className,
  from = "from-accent-primary",
  to = "to-accent-secondary",
}: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        from,
        to,
        className
      )}
    >
      {children}
    </span>
  );
}
