import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  sub?: string;
  className?: string;
}

export default function StatCard({ value, label, sub, className }: StatCardProps) {
  return (
    <div className={cn("ws-card p-5 text-center hover:border-ws-ind/40 transition-all", className)}>
      <div className="font-bricolage font-extrabold text-2xl text-ws-cyan">{value}</div>
      <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/35 mt-2">{label}</div>
      {sub && <div className="text-xs text-white/25 mt-1">{sub}</div>}
    </div>
  );
}
