import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  sub?: string;
  className?: string;
}

export default function StatCard({ value, label, sub, className }: StatCardProps) {
  return (
    <div className={cn("lux-card p-5 text-center hover:border-lux-cyan/30 transition-all", className)}>
      <div className="font-bricolage font-extrabold text-2xl text-lux-cyan tabular-nums">{value}</div>
      <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-lux-muted mt-2">{label}</div>
      {sub && <div className="text-xs text-lux-muted/70 mt-1">{sub}</div>}
    </div>
  );
}
