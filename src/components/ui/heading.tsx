import { cn } from "@/lib/cn";

type HeadingLevel = 1 | 2 | 3 | 4;

interface HeadingProps {
  level?: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}

const levelStyles: Record<HeadingLevel, string> = {
  1: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight",
  2: "text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight",
  3: "text-xl sm:text-2xl font-semibold",
  4: "text-lg font-semibold",
};

/** Semantic heading component with consistent typography hierarchy */
export function Heading({ level = 2, children, className }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag className={cn("text-text-primary", levelStyles[level], className)}>
      {children}
    </Tag>
  );
}
