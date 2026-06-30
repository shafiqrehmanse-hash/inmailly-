"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { categoryIcon } from "@/lib/links";
import type { OutreachLink } from "@/lib/types";
import { getVisitedLinkIds, markLinkVisited } from "@/lib/visited-links";
import { cn, formatDate, truncateUrl } from "@/lib/utils";

export default function LinkCard({
  link,
  mode,
  onClaim,
  onMarkUsed,
  onRelease,
  onAddLead,
}: {
  link: OutreachLink;
  mode: "pool" | "mine" | "used";
  onClaim?: () => void;
  onMarkUsed?: () => void;
  onRelease?: () => void;
  onAddLead?: () => void;
}) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    setOpened(getVisitedLinkIds().has(link.id));
  }, [link.id]);

  function handleOpen() {
    markLinkVisited(link.id);
    setOpened(true);
  }

  const isUsed = link.status === "used" || mode === "used";

  return (
    <div
      className={cn(
        "relative lux-card-elite p-4 sm:p-5 transition-all duration-300 overflow-hidden",
        isUsed
          ? "border-lux-violet/25 shadow-[0_0_32px_rgba(139,92,246,0.06)]"
          : opened
            ? "border-emerald-400/30 shadow-[0_0_32px_rgba(52,211,153,0.08)]"
            : "hover:border-lux-cyan/30 hover:shadow-[0_0_28px_rgba(34,211,238,0.06)]"
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
          isUsed
            ? "bg-gradient-to-b from-lux-violet via-lux-blue to-transparent"
            : opened
              ? "bg-gradient-to-b from-emerald-400 via-lux-cyan to-transparent"
              : "bg-gradient-to-b from-lux-cyan/50 to-transparent opacity-60"
        )}
        aria-hidden
      />

      <div className="flex flex-wrap items-start gap-2 mb-3 pl-1">
        <span className="text-lg leading-none mt-0.5">{categoryIcon(link.category)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "font-bricolage font-extrabold text-[0.95rem]",
                opened && !isUsed ? "text-emerald-300" : "text-lux-text"
              )}
            >
              {link.smart_label || "Link"}
            </span>
            <Badge variant={link.category} className="normal-case tracking-normal text-[0.58rem]">
              {link.category}
            </Badge>
            {opened && !isUsed && (
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 px-2 py-0.5 rounded-lg shadow-[0_0_12px_rgba(52,211,153,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                Visited
              </span>
            )}
          </div>
          {link.batch_name && (
            <span className="inline-block mt-1.5 text-[0.62rem] text-lux-muted/80 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
              {link.batch_name}
            </span>
          )}
        </div>
        <Badge variant={link.status} className="shrink-0 ml-auto">
          {link.status}
        </Badge>
      </div>

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpen}
        className={cn(
          "text-sm block truncate mb-3 pl-1 font-medium transition-colors",
          opened
            ? "text-emerald-400 hover:text-emerald-300"
            : "text-lux-cyan hover:text-lux-cyan/80"
        )}
      >
        {truncateUrl(link.url, 60)}
      </a>

      {link.ai_hint && (
        <div className="text-xs text-lux-muted/90 bg-gradient-to-r from-lux-blue/10 to-transparent border border-lux-blue/20 border-l-lux-blue/50 pl-3 py-2.5 mb-3 rounded-xl">
          {link.ai_hint}
        </div>
      )}

      {(link.claimed_at || link.used_at) && (
        <div className="text-[0.68rem] text-lux-muted/75 mb-3 pl-1 tabular-nums">
          {link.claimed_at && <span>Claimed {formatDate(link.claimed_at)}</span>}
          {link.used_at && (
            <span>
              {link.claimed_at ? " · " : ""}
              Completed {formatDate(link.used_at)}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pl-1">
        <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={handleOpen}>
          <Button variant="lux-soft" size="sm">
            {opened ? "Open again ↗" : "Open profile ↗"}
          </Button>
        </a>
        {mode === "pool" && onClaim && (
          <Button variant="lux-cyan" size="sm" onClick={onClaim}>
            Claim link
          </Button>
        )}
        {mode === "mine" && (
          <>
            {onMarkUsed && (
              <Button variant="lux-success" size="sm" onClick={onMarkUsed}>
                Mark complete
              </Button>
            )}
            {onRelease && (
              <Button variant="lux-ghost" size="sm" onClick={onRelease}>
                Release
              </Button>
            )}
          </>
        )}
        {(mode === "mine" || mode === "used") && onAddLead && (
          <Button variant="lux" size="sm" onClick={onAddLead}>
            + Add as lead
          </Button>
        )}
      </div>
    </div>
  );
}
