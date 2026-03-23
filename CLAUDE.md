# Airportronics Website

## Overview

Premium website for **Airportronics** — a global airport intelligence and strategy platform. Positioned as "The Intelligence Layer for Global Airports." Targets airport executives, aviation regulators, consultants, airlines, and infrastructure investors.

## Tech Stack

- **Framework**: Next.js 16 (App Router, `src/` directory)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with CSS custom properties for theming
- **Animation**: Framer Motion (scroll reveals, staggered grids, counters)
- **Charts**: Recharts (SVG-based interactive dashboard mockups)
- **Theming**: next-themes (dark default, light mode toggle)
- **Icons**: lucide-react
- **Utilities**: clsx + tailwind-merge (via `cn()` helper)

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout: fonts, ThemeProvider, Header, Footer, metadata
│   ├── page.tsx            # Homepage: assembles all 12 section components
│   └── globals.css         # Design system: CSS vars, Tailwind @theme, base styles
├── components/
│   ├── layout/             # Structural components
│   │   ├── header.tsx      # Sticky nav (client: scroll state)
│   │   ├── footer.tsx      # Company details, nav columns, legal
│   │   ├── section-wrapper.tsx  # Consistent section padding/max-width/id
│   │   └── mobile-nav.tsx  # Slide-out mobile menu (client)
│   ├── ui/                 # Design system primitives (stateless, reusable)
│   │   ├── button.tsx      # Variants: primary, secondary, ghost, premium
│   │   ├── badge.tsx       # Variants: default, accent, premium, success, danger
│   │   ├── card.tsx        # Variants: default, glass, elevated, glow
│   │   ├── heading.tsx     # Semantic h1-h4 with typography hierarchy
│   │   ├── gradient-text.tsx  # Text with gradient color fill
│   │   ├── kpi-card.tsx    # KPI display with animated counter (client)
│   │   ├── theme-toggle.tsx   # Dark/light mode toggle (client)
│   │   └── divider.tsx     # Gradient horizontal rule
│   ├── sections/           # Homepage sections (one per file)
│   │   ├── hero.tsx        # Animated hero with gradient bg, CTAs, stats
│   │   ├── credibility-strip.tsx  # Industry standard logos strip
│   │   ├── about.tsx       # Company narrative + capability pillars
│   │   ├── platform-pillars.tsx   # 6 capability cards in grid
│   │   ├── book-series.tsx # 4 book covers with 3D tilt effect
│   │   ├── benchmarking.tsx    # Dashboard mockup: KPIs + 3 charts
│   │   ├── live-intelligence.tsx  # Live data table with status indicators
│   │   ├── charges-tariff.tsx  # Charges DB features + line chart
│   │   ├── advisory.tsx    # 4 advisory service cards
│   │   ├── research-reports.tsx  # Publication cards grid
│   │   ├── future-vision.tsx   # Alternating timeline roadmap
│   │   └── enterprise-cta.tsx  # Final CTA with gradient backdrop
│   ├── charts/             # Recharts wrapper components (all client)
│   │   ├── airport-performance-chart.tsx  # Area chart (pax throughput)
│   │   ├── charges-comparison-chart.tsx   # Bar chart (airport charges)
│   │   ├── regional-distribution-chart.tsx # Donut chart (regions)
│   │   └── trend-sparkline.tsx            # Inline sparkline
│   └── motion/             # Animation wrapper components (all client)
│       ├── fade-in.tsx     # Scroll-triggered fade with direction
│       ├── stagger-children.tsx  # Parent stagger + StaggerItem child
│       └── count-up.tsx    # Animated number counter
├── lib/                    # Utilities and configuration
│   ├── cn.ts              # clsx + tailwind-merge helper
│   ├── fonts.ts           # Inter + JetBrains Mono font config
│   ├── site-config.ts     # Site metadata, nav, footer links, company info
│   ├── motion-variants.ts # Centralized Framer Motion variant definitions
│   └── chart-data.ts      # Static mockup data for all charts
└── types/
    └── index.ts           # Shared TypeScript interfaces
```

## Design System

### Theme Architecture

Colors are defined as CSS custom properties in `globals.css`:
- `:root` — light theme values
- `.dark` — dark theme values (default)
- `@theme inline` maps CSS vars to Tailwind tokens

Tailwind classes use the token names directly: `bg-surface`, `text-text-primary`, `border-border-default`, `text-accent-primary`, etc.

### Color Palette (Dark Theme)

| Token | Hex | Role |
|---|---|---|
| `background` | `#0a0e1a` | Page background |
| `surface` | `#111827` | Card/panel background |
| `surface-secondary` | `#0d1321` | Alternate section bg |
| `surface-elevated` | `#1a2332` | Hover/raised surfaces |
| `accent-primary` | `#38bdf8` | Primary accent (sky blue) |
| `accent-secondary` | `#818cf8` | Secondary accent (indigo) |
| `accent-warm` | `#f59e0b` | Gold/premium accent |
| `accent-success` | `#34d399` | Positive data |
| `accent-danger` | `#f87171` | Negative data |

### Typography

- **Display**: Inter, text-4xl to text-7xl, bold — hero headline
- **Body**: Inter, text-base to text-lg — paragraphs
- **Mono**: JetBrains Mono, text-sm — data values, KPIs, codes
- Use the `<Heading>` component for consistent h1-h4 styling

### Component Patterns

- **All sections** wrap content in `<SectionWrapper>` for consistent spacing
- **Animations** use `<FadeIn>` or `<StaggerChildren>` + `<StaggerItem>`
- **Cards** use the `<Card>` component with appropriate variant
- **Client components** are marked with `"use client"` only when needed (motion, charts, interactivity)

## How to Add a New Section

1. Create `src/components/sections/my-section.tsx`
2. Use `SectionWrapper` as the outer container with an `id` prop
3. Wrap content in `<FadeIn>` for scroll animation
4. Import and add to `src/app/page.tsx` in the desired position
5. Add the section's anchor link to `siteConfig.nav` in `src/lib/site-config.ts` if it should appear in nav

## How to Modify the Theme

- Edit CSS custom properties in `src/app/globals.css` under `:root` (light) and `.dark` (dark)
- Token-to-Tailwind mapping is in the `@theme inline` block in the same file
- Changes propagate automatically to all components using the token classes

## How to Add New Chart Types

1. Create a new component in `src/components/charts/`
2. Mark it `"use client"`
3. Add mock data to `src/lib/chart-data.ts`
4. Use `<ResponsiveContainer>` from Recharts for responsiveness
5. Match tooltip styling to existing charts (dark bg, rounded, etc.)

## Company Details

- **Operating entity**: Aladdin Technologies Ltd
- **Registration**: 16170227
- **Address**: 7 Kent House, Stratton Close, Edgware, London HA8 6PR, UK
- These are configured in `src/lib/site-config.ts` and rendered in the footer

## Notes

- Recharts logs warnings during SSR about container dimensions — this is expected and harmless
- The `suppressHydrationWarning` on `<html>` is required by next-themes to avoid hydration mismatches
- Motion variants are centralized in `src/lib/motion-variants.ts` — update them there for global changes
- The `prefers-reduced-motion` user preference is respected via `<MotionConfig reducedMotion="user">`
