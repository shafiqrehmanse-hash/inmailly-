"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LeadModal from "@/components/team/LeadModal";
import type { Lead, TeamMember } from "@/lib/types";

type LeadWithSnippet = Lead & { lastMessage?: string | null };

export default function ResponsesPage() {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [leads, setLeads] = useState<LeadWithSnippet[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team/responses");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return;
    setMember(data.member as TeamMember);
    setLeads((data.responses as LeadWithSnippet[]) || []);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl lux-gradient-text">💬 Responses</h1>
        <p className="text-lux-muted text-sm mt-1">
          Leads who replied, showed interest, or have an inbound message in their thread. New prospects
          without a reply stay on{" "}
          <a href="/team/leads" className="text-lux-cyan font-semibold hover:underline">
            My Leads
          </a>
          .
        </p>
      </div>

      <div className="lux-card-elite border-lux-cyan/25 bg-lux-cyan/[0.04] px-4 py-3 text-sm text-lux-muted">
        <strong className="text-lux-cyan">Tip:</strong> Open a lead → log their reply with sender{" "}
        <strong className="text-lux-text">lead</strong> in the thread, or set status to{" "}
        <strong className="text-lux-text">Replied</strong> / <strong className="text-lux-text">Interested</strong>{" "}
        to show them here.
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="lux-skeleton h-28" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="lux-card-elite text-center py-14 text-lux-muted border-dashed border-lux-cyan/20">
            No active responses yet. When someone replies, log it in their lead thread on My Leads.
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="lux-card-elite p-4 pl-5 border-l-2 border-l-lux-cyan/40 hover:border-lux-cyan/50 hover:shadow-[0_0_32px_rgba(34,211,238,0.06)] transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bricolage font-bold text-lux-text">{lead.name}</div>
                  {lead.company && (
                    <div className="text-sm text-lux-muted">{lead.company}</div>
                  )}
                </div>
                <Badge variant={lead.status}>{lead.status}</Badge>
              </div>
              {lead.lastMessage && (
                <p className="text-sm text-lux-muted mt-3 line-clamp-2 italic bg-lux-bg2/50 rounded-lg px-3 py-2 border border-white/[0.04]">
                  &ldquo;{lead.lastMessage}…&rdquo;
                </p>
              )}
              <Button
                variant="lux-ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSelectedLead(lead);
                  setModalOpen(true);
                }}
              >
                View thread
              </Button>
            </div>
          ))
        )}
      </div>

      {member && selectedLead && (
        <LeadModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode="view"
          memberId={member.id}
          memberName={member.name}
          lead={selectedLead}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
