"use client";

import { BarChart3 } from "lucide-react";

export default function BenchmarkingPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Benchmarking</h1>
        <p className="text-sm text-gray-500">Compare your airport performance against industry peers</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <BarChart3 size={40} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Compare your yields, charges, and revenue performance against similar airports worldwide.
          Benchmark by region, size, traffic volume, and revenue category.
        </p>
      </div>
    </div>
  );
}
