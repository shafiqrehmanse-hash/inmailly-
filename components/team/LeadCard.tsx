"use client";

import Badge from "@/components/ui/Badge";
import type { Lead } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";

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
      className={cn(
        "lux-card-elite p-4 w-full text-left transition-all duration-300",
        "hover:border-lux-cyan/35 hover:shadow-[0_0_28px_rgba(34,211,238,0.06)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lux-cyan/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bricolage font-extrabold text-lux-text">{lead.name}</div>
          {lead.company && (
            <div className="text-sm text-lux-muted mt-0.5">{lead.company}</div>
          )}
        </div>
        <Badge variant={lead.status}>{lead.status.replace("_", " ")}</Badge>
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
