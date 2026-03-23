import { cn } from "@/lib/cn";

type CardVariant = "default" | "glass" | "elevated" | "glow";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  hover?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-surface border border-border-default",
  glass: "backdrop-blur-xl bg-glass-bg border border-glass-border",
  elevated: "bg-surface-elevated shadow-lg",
  glow: "backdrop-blur-xl bg-glass-bg border border-glass-border hover:glow-border",
};

/** Versatile card component with multiple visual variants */
export function Card({ children, variant = "default", className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-6 transition-all duration-300",
        variantStyles[variant],
        hover && "hover:-translate-y-1 hover:shadow-xl cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
