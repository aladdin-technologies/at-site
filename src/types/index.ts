export interface NavLink {
  label: string;
  href: string;
}

export interface SectionProps {
  id?: string;
  className?: string;
}

export interface KpiData {
  label: string;
  value: string;
  change: number;
  unit?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
}

export interface BookVolume {
  title: string;
  subtitle: string;
  edition: string;
  color: string;
}

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

export interface ReportItem {
  title: string;
  category: string;
  date: string;
  description: string;
}
