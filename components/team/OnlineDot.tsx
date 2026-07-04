import { cn } from "@/lib/utils";

/** Blinking dark-green presence indicator. */
export default function OnlineDot({
  online,
  className,
}: {
  online?: boolean;
  className?: string;
}) {
  if (!online) {
    return (
      <span
        className={cn("inline-block h-2 w-2 rounded-full bg-zinc-500 shrink-0", className)}
        title="Offline"
        aria-hidden
      />
    );
  }

  return (
    <span className={cn("relative inline-flex h-2.5 w-2.5 shrink-0", className)} title="Online">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-700 ring-1 ring-emerald-400/50" />
    </span>
  );
}
