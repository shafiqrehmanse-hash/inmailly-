"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { categoryIcon } from "@/lib/links";
import type { OutreachLink } from "@/lib/types";
import { formatDate, truncateUrl } from "@/lib/utils";

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
  return (
    <div className="lux-card p-4 hover:border-lux-cyan/30 transition-all">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-lg">{categoryIcon(link.category)}</span>
        <span className="font-bricolage font-bold text-sm text-lux-text">
          {link.smart_label || "Link"}
        </span>
        <Badge variant={link.category}>{link.category}</Badge>
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
        className="text-sm text-lux-cyan hover:underline block truncate mb-3"
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
        <a href={link.url} target="_blank" rel="noopener noreferrer">
          <Button variant="lux-ghost" size="sm">
            Open ↗
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
