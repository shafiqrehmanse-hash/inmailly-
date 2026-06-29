import { cn } from "@/lib/utils";

export default function AdminStatCard({
  value,
  label,
  sub,
  className,
}: {
  value: string | number;
  label: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn("admin-card p-5", className)}>
      <div className="font-bricolage font-extrabold text-2xl text-ind">{value}</div>
      <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-dim mt-2">{label}</div>
      {sub && <div className="text-xs text-dimmer mt-1">{sub}</div>}
    </div>
  );
}
