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
        "lux-card p-4 transition-all",
        isUsed
          ? "border-white/[0.06] opacity-80"
          : opened
            ? "border-emerald-500/35 bg-emerald-500/[0.06]"
            : "hover:border-lux-cyan/30"
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-lg">{categoryIcon(link.category)}</span>
        <span
          className={cn(
            "font-bricolage font-bold text-sm",
            opened && !isUsed ? "text-emerald-300/90" : "text-lux-text"
          )}
        >
          {link.smart_label || "Link"}
        </span>
        <Badge variant={link.category}>{link.category}</Badge>
        {opened && !isUsed && (
          <span className="text-[0.65rem] font-bold uppercase tracking-wide text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
            Opened
          </span>
        )}
        {link.batch_name && (
          <span className="text-[0.65rem] text-lux-muted bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full">
            {link.batch_name}
          </span>
        )}
        <Badge variant={link.status} className="ml-auto">
          {link.status}
        </Badge>
      </div>

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpen}
        className={cn(
          "text-sm block truncate mb-3 transition-colors",
          opened
            ? "text-emerald-400/85 hover:text-emerald-300"
            : "text-lux-cyan hover:underline"
        )}
      >
        {truncateUrl(link.url, 60)}
      </a>

      {link.ai_hint && (
        <div className="text-xs text-lux-muted bg-lux-blue/10 border-l-2 border-lux-blue pl-3 py-2 mb-3 rounded-r-lg">
          {link.ai_hint}
        </div>
      )}

      {(link.claimed_at || link.used_at) && (
        <div className="text-[0.7rem] text-lux-muted/70 mb-3">
          {link.claimed_at && <span>Claimed {formatDate(link.claimed_at)}</span>}
          {link.used_at && (
            <span>
              {link.claimed_at ? " · " : ""}
              Used {formatDate(link.used_at)}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={handleOpen}>
          <Button variant="lux-ghost" size="sm" className={opened ? "text-emerald-400/90" : ""}>
            {opened ? "Open again ↗" : "Open ↗"}
          </Button>
        </a>
        {mode === "pool" && onClaim && (
          <Button variant="lux" size="sm" onClick={onClaim}>
            🎯 Claim
          </Button>
        )}
        {mode === "mine" && (
          <>
            {onMarkUsed && (
              <Button variant="lux" size="sm" onClick={onMarkUsed}>
                ✅ Mark Used
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
          <Button variant="lux-ghost" size="sm" onClick={onAddLead}>
            + Add as Lead
          </Button>
        )}
      </div>
    </div>
  );
}
