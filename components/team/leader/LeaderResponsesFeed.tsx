"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { formatRelative } from "@/lib/utils";

type ResponseRow = {
  id: string;
  leadName: string;
  company: string | null;
  status: string;
  memberName: string;
  updatedAt: string;
  lastMessage: string | null;
};

export default function LeaderResponsesFeed() {
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team/leader/responses");
    const data = await res.json();
    setResponses(data.responses || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <p className="text-sm text-lux-muted">Read-only feed of recent team replies — for coaching.</p>
        <Button variant="lux-soft" size="sm" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading && <div className="lux-card-elite p-6 text-sm text-lux-muted">Loading…</div>}
      {!loading && responses.length === 0 && (
        <div className="lux-card-elite p-6 text-sm text-lux-muted">No recent responses yet.</div>
      )}

      <div className="space-y-2">
        {responses.map((r) => (
          <div key={r.id} className="lux-card-elite p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-lux-text">{r.leadName}</div>
                {r.company && <div className="text-xs text-lux-muted">{r.company}</div>}
              </div>
              <div className="text-right">
                <span className="text-[0.62rem] font-bold uppercase text-lux-violet">{r.status.replace("_", " ")}</span>
                <div className="text-[0.58rem] text-lux-muted mt-1">{r.memberName}</div>
              </div>
            </div>
            {r.lastMessage && (
              <p className="text-sm text-lux-muted mt-2 line-clamp-2">&ldquo;{r.lastMessage}&rdquo;</p>
            )}
            <p className="text-[0.58rem] text-lux-muted mt-2">{formatRelative(r.updatedAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
