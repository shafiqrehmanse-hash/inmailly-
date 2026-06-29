"use client";

import Badge from "@/components/ui/Badge";
import type { Lead } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

export default function LeadCard({
  lead,
  messageCount,
  onClick,
}: {
  lead: Lead;
  messageCount?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="lux-card p-4 w-full text-left hover:border-lux-cyan/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bricolage font-bold text-lux-text">{lead.name}</div>
          {lead.company && (
            <div className="text-sm text-lux-muted mt-0.5">{lead.company}</div>
          )}
        </div>
        <Badge variant={lead.status}>{lead.status}</Badge>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-lux-muted/70">
        <span>Updated {formatRelative(lead.updated_at)}</span>
        {messageCount !== undefined && (
          <span>{messageCount} message{messageCount !== 1 ? "s" : ""}</span>
        )}
        {lead.deal_closed && (
          <span className="text-emerald-400 font-semibold">Deal closed</span>
        )}
      </div>
    </button>
  );
}
