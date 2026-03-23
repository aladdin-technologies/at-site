"use client";

import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FadeIn } from "@/components/motion/fade-in";
import { Heading } from "@/components/ui/heading";
import { GradientText } from "@/components/ui/gradient-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  StaggerChildren,
  StaggerItem,
} from "@/components/motion/stagger-children";
import { BookOpen, ArrowRight } from "lucide-react";

const books = [
  {
    title: "Aeronautical Revenue",
    subtitle: "Airport Charges, Tariffs & Revenue Frameworks",
    edition: "Volume 1",
    color: "from-sky-500 to-blue-700",
    accent: "#38bdf8",
  },
  {
    title: "Non-Aeronautical Revenue",
    subtitle: "Commercial Strategy & Retail Optimisation",
    edition: "Volume 2",
    color: "from-indigo-500 to-purple-700",
    accent: "#818cf8",
  },
  {
    title: "Managing Costs",
    subtitle: "Operational Efficiency & Cost Benchmarking",
    edition: "Volume 3",
    color: "from-emerald-500 to-teal-700",
    accent: "#34d399",
  },
  {
    title: "Maximising Profits",
    subtitle: "Financial Performance & Value Creation",
    edition: "Volume 4",
    color: "from-amber-500 to-orange-700",
    accent: "#f59e0b",
  },
  {
    title: "Financing Airports",
    subtitle: "Capital Markets, Investment & Ownership Models",
    edition: "Volume 5",
    color: "from-rose-500 to-pink-700",
    accent: "#f43f5e",
  },
  {
    title: "The Pathway to SAF",
    subtitle: "Sustainable Aviation Fuel Strategy & Economics",
    edition: "Volume 6",
    color: "from-lime-500 to-green-700",
    accent: "#84cc16",
  },
];

/** Book series section — premium publishing showcase with 3D-style book covers */
export function BookSeries() {
  return (
    <SectionWrapper id="books">
      <FadeIn>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="premium" className="mb-6">
            <BookOpen className="h-3.5 w-3.5" />
            Published Research
          </Badge>
          <Heading level={2} className="mb-4">
            The Airportronics{" "}
            <GradientText from="from-accent-warm" to="to-yellow-400">
              Book Series
            </GradientText>
          </Heading>
          <p className="text-text-secondary">
            Definitive references on airport economics, benchmarking, charges,
            and strategy. Written for professionals who shape aviation
            infrastructure.
          </p>
        </div>
      </FadeIn>

      {/* Horizontal scroll on mobile, 6-col grid on desktop */}
      <StaggerChildren className="mt-16 grid grid-flow-col auto-cols-[11rem] gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide lg:auto-cols-fr lg:grid-cols-6 lg:overflow-visible lg:pb-0">
        {books.map((book) => (
          <StaggerItem key={book.title} className="snap-start">
            <div className="group cursor-pointer">
              {/* Book cover */}
              <div
                className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-2xl transition-transform duration-500 group-hover:scale-[1.03] group-hover:-rotate-1"
                style={{ perspective: "1000px" }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${book.color}`}
                />
                {/* Spine effect */}
                <div className="absolute inset-y-0 left-0 w-3 bg-black/20" />
                {/* Content on cover */}
                <div className="relative flex h-full flex-col justify-between p-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                      {book.edition}
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/40">
                      Airportronics Series
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold leading-tight text-white">
                      {book.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-snug text-white/70">
                      {book.subtitle}
                    </p>
                  </div>
                  {/* Decorative line */}
                  <div
                    className="h-0.5 w-8 rounded-full"
                    style={{ backgroundColor: book.accent }}
                  />
                </div>
              </div>
              {/* Caption */}
              <div className="mt-3 text-center">
                <h4 className="text-sm font-semibold text-text-primary">
                  {book.title}
                </h4>
                <p className="mt-0.5 text-[11px] text-text-tertiary">
                  {book.edition}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerChildren>

      <FadeIn className="mt-12 text-center">
        <Button variant="secondary">
          View All Publications
          <ArrowRight className="h-4 w-4" />
        </Button>
      </FadeIn>
    </SectionWrapper>
  );
}
