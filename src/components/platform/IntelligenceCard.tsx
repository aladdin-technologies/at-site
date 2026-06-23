import { BarChart3, Building2, TrendingUp } from "lucide-react";

const icons = { revenue: BarChart3, asset: Building2, economics: TrendingUp };
const accents = {
  revenue: "from-cyan-500/20 to-blue-600/20 border-cyan-500/15 hover:border-cyan-500/30",
  asset: "from-violet-500/20 to-purple-600/20 border-violet-500/15 hover:border-violet-500/30",
  economics: "from-emerald-500/20 to-teal-600/20 border-emerald-500/15 hover:border-emerald-500/30",
};
const iconColors = {
  revenue: "text-cyan-400",
  asset: "text-violet-400",
  economics: "text-emerald-400",
};

export function IntelligenceCard({
  variant,
  title,
  description,
  status,
}: {
  variant: "revenue" | "asset" | "economics";
  title: string;
  description: string;
  status: string;
}) {
  const Icon = icons[variant];
  return (
    <div
      className={`relative group rounded-2xl border bg-gradient-to-br ${accents[variant]} backdrop-blur-sm p-6 transition-all duration-300 cursor-default`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center ${iconColors[variant]}`}
        >
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/[0.06] text-slate-400 border border-white/[0.06]">
          {status}
        </span>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
