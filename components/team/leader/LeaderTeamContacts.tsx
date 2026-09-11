"use client";

import { useEffect, useState } from "react";
import TeamMemberInfoModal, { type TeamMemberInfo } from "@/components/team/TeamMemberInfoModal";
import { whatsappHref } from "@/lib/utils";

type Worker = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo_url?: string | null;
  linkedin_url?: string | null;
  role: string;
};

export default function LeaderTeamContacts({ leaderName }: { leaderName: string }) {
  const [members, setMembers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TeamMemberInfo | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/team/leader/members")
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []))
      .finally(() => setLoading(false));
  }, []);

  function notify(msg: string, type?: "error" | "success") {
    setToast(type === "error" ? `⚠ ${msg}` : msg);
    setTimeout(() => setToast(""), 3500);
  }

  if (loading) {
    return <p className="text-sm text-lux-muted">Loading contacts…</p>;
  }

  if (!members.length) {
    return (
      <div className="lux-card p-6 text-sm text-lux-muted">
        No assigned members yet. Admin must assign workers to you first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {toast && (
        <div className="lux-toast-anchor" role="status">
          <div className="lux-toast-success text-center">{toast}</div>
        </div>
      )}
      <p className="text-sm text-lux-muted">
        Click a member for photo, phone, LinkedIn, and to email them. Hidden members still appear here.
      </p>
      <div className="lux-card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-lux-muted text-xs uppercase border-b border-white/[0.06]">
              <th className="text-left px-4 py-3">Member</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">WhatsApp / phone</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const wa = whatsappHref(m.phone);
              return (
                <tr
                  key={m.id}
                  className="border-b border-white/[0.06] last:border-0 cursor-pointer hover:bg-white/[0.03]"
                  onClick={() =>
                    setSelected({
                      id: m.id,
                      name: m.name,
                      email: m.email,
                      phone: m.phone,
                      photo_url: m.photo_url,
                      linkedin_url: m.linkedin_url,
                      role: m.role,
                    })
                  }
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-lux-text">{m.name}</div>
                    <div className="text-[0.62rem] text-lux-muted uppercase">{m.role}</div>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${m.email}`}
                      className="text-lux-cyan hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {m.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {m.phone ? (
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-lux-text">{m.phone}</span>
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[0.65rem] font-bold uppercase text-emerald-300 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            WhatsApp →
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-lux-muted">No phone on file</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TeamMemberInfoModal
        member={selected}
        onClose={() => setSelected(null)}
        mode="leader"
        leaderName={leaderName}
        onNotify={notify}
      />
    </div>
  );
}
