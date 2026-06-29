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

const variants: Record<BadgeVariant, string> = {
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
