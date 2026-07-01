"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import type { TeamTask } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type TaskRow = TeamTask & { assignee?: { id: string; name: string; email: string } | null };
type Worker = { id: string; name: string; email: string };

export default function LeaderAssignTasks() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", dueAt: "" });
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const [membersRes, tasksRes] = await Promise.all([
      fetch("/api/team/leader/members"),
      fetch("/api/team/leader/worker-tasks"),
    ]);
    const membersData = await membersRes.json();
    const tasksData = await tasksRes.json();
    setWorkers(membersData.members || []);
    setTasks(tasksData.tasks || []);
    if (!form.assignedTo && membersData.members?.[0]?.id) {
      setForm((f) => ({ ...f, assignedTo: membersData.members[0].id }));
    }
  }, [form.assignedTo]);

  useEffect(() => {
    load();
  }, [load]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function createTask() {
    if (!form.title.trim() || !form.assignedTo) {
      flash("Title and assignee required");
      return;
    }
    const res = await fetch("/api/team/leader/worker-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) flash(data.error);
    else {
      flash("Task assigned to worker");
      setForm({ title: "", description: "", assignedTo: form.assignedTo, dueAt: "" });
      load();
    }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className="lux-toast-anchor" role="status">
          <div className="lux-toast-success text-center">{toast}</div>
        </div>
      )}

      <div className="lux-card-elite p-5 space-y-3">
        <h2 className="font-bricolage font-bold text-lux-text">Assign task to worker</h2>
        <input
          className="lux-input"
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="lux-input min-h-[72px]"
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <LuxSelect
          value={form.assignedTo}
          onChange={(v) => setForm({ ...form, assignedTo: v })}
          options={
            workers.length
              ? workers.map((w) => ({ value: w.id, label: w.name }))
              : [{ value: "", label: "No workers" }]
          }
        />
        <input
          className="lux-input"
          type="date"
          value={form.dueAt}
          onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
        />
        <Button variant="lux-cyan" className="w-full" onClick={createTask} disabled={!workers.length}>
          Assign task
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-violet/80">
          Tasks you assigned
        </h2>
        {tasks.length === 0 ? (
          <div className="lux-card-elite p-6 text-sm text-lux-muted">No worker tasks yet.</div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="lux-card-elite p-4 flex flex-wrap gap-3 justify-between">
              <div className="min-w-0">
                <div className="font-semibold text-lux-text">{t.title}</div>
                {t.description && <p className="text-sm text-lux-muted mt-1">{t.description}</p>}
                <p className="text-[0.65rem] text-lux-muted mt-2">
                  → {t.assignee?.name || "Worker"}
                  {t.due_at && ` · Due ${formatDate(t.due_at)}`}
                </p>
              </div>
              <span className="text-[0.62rem] font-bold uppercase text-lux-cyan self-start">{t.status.replace("_", " ")}</span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
