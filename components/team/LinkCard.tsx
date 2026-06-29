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
    <div className="card-dark p-4 hover:bg-card2 transition-colors">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-lg">{categoryIcon(link.category)}</span>
        <span className="font-bricolage font-bold text-sm">
          {link.smart_label || "Link"}
        </span>
        <Badge variant={link.category}>{link.category}</Badge>
        {link.batch_name && (
          <span className="text-[0.65rem] text-dimmer bg-white/5 px-2 py-0.5 rounded-full">
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
        className="text-sm text-cyan2 hover:underline block truncate mb-3"
      >
        {truncateUrl(link.url, 60)}
      </a>

      {link.ai_hint && (
        <div className="text-xs text-dim bg-white/[0.03] border-l-2 border-indigo pl-3 py-2 mb-3 rounded-r-lg">
          {link.ai_hint}
        </div>
      )}

      {(link.claimed_at || link.used_at) && (
        <div className="text-[0.7rem] text-dimmer mb-3">
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
          <Button variant="ghost" size="sm">
            Open ↗
          </Button>
        </a>
        {mode === "pool" && onClaim && (
          <Button size="sm" onClick={onClaim}>
            🎯 Claim
          </Button>
        )}
        {mode === "mine" && (
          <>
            {onMarkUsed && (
              <Button size="sm" onClick={onMarkUsed}>
                ✅ Mark Used
              </Button>
            )}
            {onRelease && (
              <Button variant="ghost" size="sm" onClick={onRelease}>
                Release
              </Button>
            )}
          </>
        )}
        {(mode === "mine" || mode === "used") && onAddLead && (
          <Button variant="ghost" size="sm" onClick={onAddLead}>
            + Add as Lead
          </Button>
        )}
      </div>
    </div>
  );
}
