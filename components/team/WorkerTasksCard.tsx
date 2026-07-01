"use client";

import { useCallback, useEffect, useState } from "react";
import LuxSelect from "@/components/ui/LuxSelect";
import type { TeamTask } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function WorkerTasksCard() {
  const [tasks, setTasks] = useState<TeamTask[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/team/worker-tasks");
    const data = await res.json();
    setTasks((data.tasks || []).filter((t: TeamTask) => t.status !== "done").slice(0, 5));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(taskId: string, status: string) {
    await fetch("/api/team/worker-tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
    load();
  }

  if (!tasks.length) return null;

  return (
    <div className="lux-card-elite p-5 border-lux-violet/20">
      <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-violet mb-3">Tasks from your leader</p>
      <div className="space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="flex flex-wrap items-start gap-3 justify-between border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-lux-text text-sm">{t.title}</div>
              {t.description && <p className="text-xs text-lux-muted mt-1">{t.description}</p>}
              {t.due_at && (
                <p className="text-[0.58rem] text-lux-muted mt-1">Due {formatDate(t.due_at)}</p>
              )}
            </div>
            <LuxSelect
              size="sm"
              className="min-w-[120px]"
              value={t.status}
              onChange={(status) => updateStatus(t.id, status)}
              options={statusOptions}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
