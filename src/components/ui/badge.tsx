import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "accent" | "premium" | "success" | "danger";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-elevated text-text-secondary border border-border-default",
  accent: "bg-accent-primary/10 text-accent-primary border border-accent-primary/20",
  premium: "bg-gradient-to-r from-accent-warm/20 to-yellow-400/20 text-accent-warm border border-accent-warm/20",
  success: "bg-accent-success/10 text-accent-success border border-accent-success/20",
  danger: "bg-accent-danger/10 text-accent-danger border border-accent-danger/20",
};

/** Small status badge / tag */
export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
