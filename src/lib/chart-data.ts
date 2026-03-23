/** Static mockup data for dashboard chart components */

export const passengerThroughputData = [
  { name: "Jan", value: 4.2, forecast: 4.5 },
  { name: "Feb", value: 4.5, forecast: 4.6 },
  { name: "Mar", value: 5.1, forecast: 5.0 },
  { name: "Apr", value: 5.8, forecast: 5.4 },
  { name: "May", value: 6.2, forecast: 5.9 },
  { name: "Jun", value: 7.1, forecast: 6.5 },
  { name: "Jul", value: 7.8, forecast: 7.2 },
  { name: "Aug", value: 7.5, forecast: 7.0 },
  { name: "Sep", value: 6.4, forecast: 6.2 },
  { name: "Oct", value: 5.9, forecast: 5.8 },
  { name: "Nov", value: 5.2, forecast: 5.3 },
  { name: "Dec", value: 5.6, forecast: 5.5 },
];

export const chargesComparisonData = [
  { name: "LHR", landing: 2850, passenger: 42.5, total: 4120 },
  { name: "CDG", landing: 2340, passenger: 38.2, total: 3580 },
  { name: "AMS", landing: 2120, passenger: 35.8, total: 3290 },
  { name: "FRA", landing: 2680, passenger: 28.4, total: 3460 },
  { name: "DXB", landing: 1890, passenger: 32.1, total: 2780 },
  { name: "SIN", landing: 2240, passenger: 46.2, total: 3410 },
  { name: "HKG", landing: 1760, passenger: 38.9, total: 2650 },
  { name: "JFK", landing: 3120, passenger: 22.5, total: 3980 },
];

export const regionalDistributionData = [
  { name: "Europe", value: 35, color: "#38bdf8" },
  { name: "Asia Pacific", value: 28, color: "#818cf8" },
  { name: "North America", value: 20, color: "#34d399" },
  { name: "Middle East", value: 10, color: "#f59e0b" },
  { name: "Other", value: 7, color: "#64748b" },
];

export const kpiMetrics = [
  { label: "Airports Tracked", value: "2,847", change: 12.4, unit: "" },
  { label: "Data Points Processed", value: "14.2M", change: 8.7, unit: "/mo" },
  { label: "Avg. Response Time", value: "1.2", change: -15.3, unit: "sec" },
  { label: "Countries Covered", value: "194", change: 3.1, unit: "" },
];

export const liveFlightData = [
  { airport: "LHR", status: "operational", pax: "234K", onTime: 82, load: 87 },
  { airport: "CDG", status: "operational", pax: "198K", onTime: 76, load: 83 },
  { airport: "DXB", status: "operational", pax: "287K", onTime: 89, load: 91 },
  { airport: "SIN", status: "operational", pax: "176K", onTime: 91, load: 79 },
  { airport: "JFK", status: "delayed", pax: "145K", onTime: 68, load: 85 },
  { airport: "NRT", status: "operational", pax: "132K", onTime: 87, load: 74 },
  { airport: "FRA", status: "operational", pax: "189K", onTime: 80, load: 86 },
  { airport: "AMS", status: "operational", pax: "167K", onTime: 78, load: 82 },
];

export const tariffHistoryData = [
  { year: "2019", lhr: 28.5, cdg: 24.8, ams: 22.3, dxb: 18.9 },
  { year: "2020", lhr: 32.1, cdg: 27.2, ams: 25.1, dxb: 19.4 },
  { year: "2021", lhr: 35.8, cdg: 30.5, ams: 27.8, dxb: 20.1 },
  { year: "2022", lhr: 38.2, cdg: 33.1, ams: 30.2, dxb: 22.8 },
  { year: "2023", lhr: 40.5, cdg: 35.8, ams: 32.5, dxb: 25.4 },
  { year: "2024", lhr: 42.5, cdg: 38.2, ams: 35.8, dxb: 28.1 },
];

export const sparklineData = {
  up: [2, 3, 2, 5, 4, 6, 5, 7, 8, 7, 9, 10],
  down: [10, 9, 8, 7, 8, 6, 7, 5, 4, 5, 3, 2],
  stable: [5, 6, 5, 7, 6, 5, 6, 7, 6, 5, 6, 5],
};
