import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  sub?: string;
  className?: string;
}

export default function StatCard({ value, label, sub, className }: StatCardProps) {
  return (
    <div className={cn("card-dark p-5 text-center hover:shadow-card hover:border-ind/30 transition-all", className)}>
      <div className="font-bricolage font-extrabold text-2xl text-ind">{value}</div>
      <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-dimmer mt-2">{label}</div>
      {sub && <div className="text-xs text-dim mt-1">{sub}</div>}
    </div>
  );
}
