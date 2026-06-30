import { cn } from "@/lib/utils";

type BadgeVariant =
  | "new"
  | "available"
  | "claimed"
  | "used"
  | "replied"
  | "interested"
  | "closed"
  | "dead"
  | "contacted"
  | "not_interested"
  | "follow_up"
  | "linkedin"
  | "salesnav"
  | "email"
  | "general";

const lightVariants: Record<BadgeVariant, string> = {
  new: "bg-ind/10 text-ind border-ind/20",
  available: "bg-green-50 text-green-700 border-green-200",
  claimed: "bg-amber-50 text-amber-700 border-amber-200",
  used: "bg-off text-dimmer border-line",
  replied: "bg-green-50 text-green-700 border-green-200",
  interested: "bg-ind/10 text-ind border-ind/20",
  closed: "bg-green-100 text-green-800 border-green-300 font-bold",
  dead: "bg-red-50 text-red-600 border-red-200",
  contacted: "bg-sky/10 text-sky border-sky/25",
  not_interested: "bg-red-50 text-red-600 border-red-200",
  follow_up: "bg-amber-50 text-amber-700 border-amber-200",
  linkedin: "bg-ind/10 text-ind border-ind/20",
  salesnav: "bg-sky/10 text-sky border-sky/25",
  email: "bg-off text-mid border-line2",
  general: "bg-off text-dimmer border-line",
};

const darkVariants: Record<BadgeVariant, string> = {
  new: "bg-lux-cyan/10 text-lux-cyan border-lux-cyan/25",
  available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  claimed: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  used: "bg-white/[0.06] text-lux-muted border-white/10",
  replied: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  interested: "bg-lux-violet/10 text-lux-violet border-lux-violet/25",
  closed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold",
  dead: "bg-red-500/10 text-red-400 border-red-500/25",
  contacted: "bg-lux-blue/10 text-lux-blue border-lux-blue/25",
  not_interested: "bg-red-500/10 text-red-400 border-red-500/25",
  follow_up: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  linkedin: "bg-lux-blue/10 text-lux-blue border-lux-blue/25",
  salesnav: "bg-lux-cyan/10 text-lux-cyan border-lux-cyan/25",
  email: "bg-white/[0.06] text-lux-muted border-white/10",
  general: "bg-white/[0.06] text-lux-muted border-white/10",
};

export default function Badge({
  variant,
  children,
  className,
  dark = true,
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wide border",
        dark ? darkVariants[variant] : lightVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
