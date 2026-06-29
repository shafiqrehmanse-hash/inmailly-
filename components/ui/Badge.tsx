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
  | "linkedin"
  | "salesnav"
  | "email"
  | "general";

const variants: Record<BadgeVariant, string> = {
  new: "bg-indigo/20 text-indigo2 border-indigo/30",
  available: "bg-green-500/15 text-green-400 border-green-500/30",
  claimed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  used: "bg-white/5 text-dimmer border-white/10",
  replied: "bg-green-500/15 text-green-400 border-green-500/30",
  interested: "bg-indigo/20 text-indigo2 border-indigo/30",
  closed: "bg-green-400/20 text-green-300 border-green-400/40 font-bold",
  dead: "bg-red-500/10 text-red-400/70 border-red-500/20",
  contacted: "bg-cyan/15 text-cyan2 border-cyan/25",
  linkedin: "bg-indigo/20 text-indigo2 border-indigo/30",
  salesnav: "bg-cyan/15 text-cyan2 border-cyan/25",
  email: "bg-white/10 text-white/60 border-white/15",
  general: "bg-white/5 text-dimmer border-white/10",
};

export default function Badge({
  variant,
  children,
  className,
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wide border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
