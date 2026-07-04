import { getActiveVictoryAnnouncements, victoryBannerText, type VictoryKind } from "@/lib/team-victory";
import { cn } from "@/lib/utils";

const KIND_STYLES: Record<
  VictoryKind,
  { emoji: string; label: string; wrap: string; accent: string; sub: string }
> = {
  deal_closed: {
    emoji: "🏆",
    label: "Deal closed",
    wrap: "border-amber-400/40 bg-gradient-to-r from-amber-500/[0.14] via-amber-500/[0.06] to-transparent",
    accent: "text-amber-300",
    sub: "Win counts on Team Performance — inspire the squad",
  },
  meeting_booked: {
    emoji: "📅",
    label: "Meeting booked",
    wrap: "border-lux-cyan/40 bg-gradient-to-r from-lux-cyan/[0.14] via-lux-blue/[0.08] to-transparent",
    accent: "text-lux-cyan",
    sub: "Pipeline moving — every meeting leads to revenue",
  },
  birthday: {
    emoji: "🎂",
    label: "Birthday",
    wrap: "border-pink-400/35 bg-gradient-to-r from-pink-500/[0.12] via-lux-violet/[0.08] to-transparent",
    accent: "text-pink-300",
    sub: "Celebrate your teammate today",
  },
  custom: {
    emoji: "✦",
    label: "Team announcement",
    wrap: "border-lux-violet/35 bg-gradient-to-r from-lux-violet/[0.12] via-transparent to-lux-blue/[0.06]",
    accent: "text-lux-violet",
    sub: "From your admin team",
  },
};

export default async function TeamVictoryBanner() {
  const rows = await getActiveVictoryAnnouncements(5);
  if (rows.length === 0) return null;

  return (
    <div className="space-y-2 mb-5 -mt-1">
      {rows.map((row) => {
        const style = KIND_STYLES[row.kind] || KIND_STYLES.custom;
        const text = victoryBannerText(row);
        return (
          <div
            key={row.id}
            className={cn(
              "relative overflow-hidden rounded-xl border px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_0_24px_rgba(0,0,0,0.15)]",
              style.wrap
            )}
          >
            <div className="flex items-start gap-3 sm:items-center">
              <span className="text-2xl sm:text-3xl leading-none shrink-0" aria-hidden>
                {style.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-[0.62rem] font-bold uppercase tracking-[0.18em] mb-0.5", style.accent)}>
                  {style.label}
                </p>
                <p className="font-bricolage font-bold text-[0.95rem] sm:text-base text-lux-text leading-snug">
                  {text}
                </p>
                <p className="text-[0.72rem] text-lux-muted mt-0.5 hidden sm:block">{style.sub}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
