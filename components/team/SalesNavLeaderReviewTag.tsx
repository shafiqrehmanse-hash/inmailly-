import { cn } from "@/lib/utils";

export default function SalesNavLeaderReviewTag({
  review,
  hasLeader = true,
  className,
}: {
  review?: string | null;
  hasLeader?: boolean;
  className?: string;
}) {
  if (review === "approved") {
    return (
      <span
        className={cn(
          "inline-block text-[0.58rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded border text-emerald-300 bg-emerald-500/15 border-emerald-500/40",
          className
        )}
      >
        Leader approved
      </span>
    );
  }
  if (review === "not_eligible") {
    return (
      <span
        className={cn(
          "inline-block text-[0.58rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded border text-slate-300 bg-white/5 border-white/15",
          className
        )}
      >
        Not eligible
      </span>
    );
  }
  if (!hasLeader) return null;
  return (
    <span
      className={cn(
        "inline-block text-[0.58rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded border text-amber-200/90 bg-amber-500/10 border-amber-500/25",
        className
      )}
    >
      Awaiting leader
    </span>
  );
}
