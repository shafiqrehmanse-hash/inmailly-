import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  sub?: string;
  className?: string;
}

export default function StatCard({ value, label, sub, className }: StatCardProps) {
  return (
    <div className={cn("lux-card-elite p-5 text-center hover:border-lux-cyan/35 transition-all duration-300 hover:shadow-[0_0_32px_rgba(34,211,238,0.08)]", className)}>
      <div className="font-bricolage font-extrabold text-2xl tabular-nums bg-gradient-to-b from-lux-text to-lux-cyan bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-lux-muted mt-2">{label}</div>
      {sub && <div className="text-xs text-lux-muted/70 mt-1">{sub}</div>}
    </div>
  );
}
