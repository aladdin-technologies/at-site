import { cn } from "@/lib/cn";

interface SectionWrapperProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  /** Use alternate background for visual rhythm */
  alternate?: boolean;
  /** Remove top padding (e.g., for hero) */
  noPadTop?: boolean;
}

/** Consistent section container with padding, max-width, and scroll offset */
export function SectionWrapper({
  id,
  children,
  className,
  alternate = false,
  noPadTop = false,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-20",
        noPadTop ? "pb-24 lg:pb-32" : "py-24 lg:py-32",
        alternate ? "bg-surface-secondary" : "bg-background",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">{children}</div>
    </section>
  );
}
