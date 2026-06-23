export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Indexing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Partial: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase border ${colors[status] ?? colors.Partial}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "Active"
            ? "bg-emerald-400 animate-pulse"
            : status === "Indexing"
              ? "bg-amber-400"
              : "bg-sky-400"
        }`}
      />
      {status}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-amber-500/15 text-amber-400 border border-amber-500/25">
      Demo Mode
    </span>
  );
}
