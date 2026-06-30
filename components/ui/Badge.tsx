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
  new: "bg-gradient-to-r from-lux-cyan/14 to-lux-blue/8 text-lux-cyan border-lux-cyan/30 shadow-[0_0_14px_rgba(34,211,238,0.1)]",
  available:
    "bg-gradient-to-r from-emerald-500/16 to-lux-cyan/8 text-emerald-300 border-emerald-400/35 shadow-[0_0_14px_rgba(52,211,153,0.12)]",
  claimed:
    "bg-gradient-to-r from-amber-500/16 to-orange-500/8 text-amber-200 border-amber-400/35 shadow-[0_0_14px_rgba(251,191,36,0.1)]",
  used: "bg-gradient-to-r from-lux-violet/18 to-lux-blue/10 text-lux-violet border-lux-violet/35 shadow-[0_0_16px_rgba(139,92,246,0.14)]",
  replied:
    "bg-gradient-to-r from-emerald-500/16 to-teal-500/8 text-emerald-300 border-emerald-400/30 shadow-[0_0_14px_rgba(52,211,153,0.1)]",
  interested:
    "bg-gradient-to-r from-lux-violet/16 to-lux-cyan/8 text-lux-violet border-lux-violet/30 shadow-[0_0_14px_rgba(139,92,246,0.1)]",
  closed:
    "bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-200 border-emerald-400/35 font-bold shadow-[0_0_14px_rgba(52,211,153,0.12)]",
  dead: "bg-gradient-to-r from-red-500/16 to-rose-600/8 text-red-300 border-red-400/30 shadow-[0_0_14px_rgba(248,113,113,0.1)]",
  contacted:
    "bg-gradient-to-r from-lux-blue/16 to-lux-cyan/8 text-lux-blue border-lux-blue/30 shadow-[0_0_14px_rgba(37,99,235,0.1)]",
  not_interested:
    "bg-gradient-to-r from-red-500/14 to-red-600/8 text-red-300 border-red-400/28 shadow-[0_0_14px_rgba(248,113,113,0.08)]",
  follow_up:
    "bg-gradient-to-r from-amber-500/14 to-amber-600/8 text-amber-200 border-amber-400/30 shadow-[0_0_14px_rgba(251,191,36,0.1)]",
  linkedin:
    "bg-gradient-to-r from-lux-blue/14 to-lux-cyan/8 text-lux-blue border-lux-blue/28 shadow-[0_0_12px_rgba(37,99,235,0.08)]",
  salesnav:
    "bg-gradient-to-r from-lux-cyan/14 to-lux-blue/8 text-lux-cyan border-lux-cyan/28 shadow-[0_0_12px_rgba(34,211,238,0.08)]",
  email: "bg-white/[0.05] text-lux-muted border-white/12",
  general: "bg-white/[0.05] text-lux-muted border-white/12",
};

export default function Badge({
  variant,
  children,
  className,
  dark = true,
  dot,
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  dot?: boolean;
}) {
  const showDot = dot ?? dark;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.62rem] font-bold uppercase tracking-[0.14em] border backdrop-blur-sm",
        dark ? darkVariants[variant] : lightVariants[variant],
        className
      )}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current opacity-90 shrink-0 shadow-[0_0_6px_currentColor]"
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
