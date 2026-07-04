"use client";

import { useCallback, useEffect, useState } from "react";
import AdminWeeklyGoalCard from "@/components/admin/AdminWeeklyGoalCard";
import TeamPerformanceBoard from "@/components/team/TeamPerformanceBoard";
import { useAdminKey } from "@/lib/admin-context";
import type { TeamPerformanceData } from "@/lib/team-performance";

export default function AdminTeamPerformanceSection() {
  const adminKey = useAdminKey();
  const [data, setData] = useState<TeamPerformanceData | null>(null);
  const [autoFeed, setAutoFeed] = useState<
    { memberName: string; assigned_count: number; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [perfRes, autoRes] = await Promise.all([
      fetch(`/api/admin/team/performance?key=${adminKey}`),
      fetch(`/api/admin/team/auto-assign?key=${adminKey}`),
    ]);
    setData(await perfRes.json());
    const autoJson = await autoRes.json();
    setAutoFeed(autoJson.recent || []);
    setLoading(false);
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <AdminWeeklyGoalCard />
      <TeamPerformanceBoard
        data={data}
        loading={loading}
        onRefresh={load}
        mode="admin"
        autoFeed={autoFeed}
      />
    </div>
  );
}
