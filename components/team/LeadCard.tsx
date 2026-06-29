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
      className="card-dark p-4 w-full text-left hover:bg-card2 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bricolage font-bold">{lead.name}</div>
          {lead.company && (
            <div className="text-sm text-dim mt-0.5">{lead.company}</div>
          )}
        </div>
        <Badge variant={lead.status}>{lead.status}</Badge>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-dimmer">
        <span>Updated {formatRelative(lead.updated_at)}</span>
        {messageCount !== undefined && (
          <span>{messageCount} message{messageCount !== 1 ? "s" : ""}</span>
        )}
        {lead.deal_closed && (
          <span className="text-green-400 font-semibold">Deal closed</span>
        )}
      </div>
    </button>
  );
}
