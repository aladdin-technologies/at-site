"use client";

import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FadeIn } from "@/components/motion/fade-in";
import { Heading } from "@/components/ui/heading";
import { GradientText } from "@/components/ui/gradient-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  StaggerChildren,
  StaggerItem,
} from "@/components/motion/stagger-children";
import { FileText, Download, ArrowRight } from "lucide-react";

const reports = [
  {
    title: "Global Airport Performance Index 2024",
    category: "Annual Benchmark",
    date: "Q4 2024",
    description:
      "Comprehensive ranking of 500+ airports across operational efficiency, financial performance, and service quality metrics.",
    color: "from-sky-500/20 to-blue-700/20",
  },
  {
    title: "European Airport Charges Review",
    category: "Charges Intelligence",
    date: "Q3 2024",
    description:
      "Detailed analysis of landing, passenger, and security charges across 120 European airports with 5-year trend analysis.",
    color: "from-indigo-500/20 to-purple-700/20",
  },
  {
    title: "Asia-Pacific Traffic Outlook",
    category: "Market Analysis",
    date: "Q2 2024",
    description:
      "Traffic recovery trajectories, capacity investment pipeline, and competitive dynamics across APAC airport markets.",
    color: "from-emerald-500/20 to-teal-700/20",
  },
  {
    title: "Airport Revenue Diversification",
    category: "Strategy Brief",
    date: "Q1 2024",
    description:
      "Non-aeronautical revenue benchmarking and emerging commercial strategies across leading global airports.",
    color: "from-amber-500/20 to-orange-700/20",
  },
];

/** Research and reports section — premium publications grid */
export function ResearchReports() {
  return (
    <SectionWrapper id="research" alternate>
      <FadeIn>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="accent" className="mb-6">
            <FileText className="h-3.5 w-3.5" />
            Research & Intelligence
          </Badge>
          <Heading level={2} className="mb-4">
            Published{" "}
            <GradientText>Research & Reports</GradientText>
          </Heading>
          <p className="text-text-secondary">
            Authoritative analysis and benchmarking reports for aviation
            professionals. Each publication combines proprietary data with
            expert interpretation.
          </p>
        </div>
      </FadeIn>

      <StaggerChildren className="mt-16 grid gap-6 sm:grid-cols-2">
        {reports.map((report) => (
          <StaggerItem key={report.title}>
            <Card variant="default" hover className="h-full">
              {/* Color accent strip */}
              <div
                className={`-mx-6 -mt-6 mb-6 h-1.5 bg-gradient-to-r ${report.color}`}
              />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{report.category}</Badge>
                    <span className="text-xs text-text-tertiary">
                      {report.date}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-text-primary">
                    {report.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {report.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-accent-primary">
                <Download className="h-4 w-4" />
                <span>Request Access</span>
              </div>
            </Card>
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
