import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  sub?: string;
  className?: string;
}

export default function StatCard({ value, label, sub, className }: StatCardProps) {
  return (
    <div className={cn("card-dark p-5 text-center hover:bg-card2 transition-colors", className)}>
      <div className="font-bricolage font-extrabold text-2xl bg-gradient-to-br from-indigo2 to-cyan bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-dimmer mt-2">
        {label}
      </div>
      {sub && <div className="text-xs text-dimmer mt-1">{sub}</div>}
    </div>
  );
}
