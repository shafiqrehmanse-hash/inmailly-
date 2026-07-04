"use client";

import { useCallback, useEffect, useState } from "react";
import TeamPerformanceBoard from "@/components/team/TeamPerformanceBoard";
import type { TeamPerformanceData } from "@/lib/team-performance";

export default function TeamPerformancePage() {
  const [data, setData] = useState<TeamPerformanceData | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team/performance");
    const json = await res.json();
    if (res.ok) {
      setData(json);
      setCurrentMemberId(json.currentMemberId || null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <TeamPerformanceBoard
      data={data}
      loading={loading}
      onRefresh={load}
      mode="team"
      currentMemberId={currentMemberId}
    />
  );
}
