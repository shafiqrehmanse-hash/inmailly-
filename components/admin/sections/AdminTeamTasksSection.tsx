"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import type { TeamMember, TeamTask } from "@/lib/types";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";
import { formatDate } from "@/lib/utils";

type TaskRow = TeamTask & {
  assignee?: { id: string; name: string; email: string; role: string } | null;
};

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function AdminTeamTasksSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", dueAt: "" });

  const leaders = members.filter((m) => m.role === "team_leader" && m.is_active);
  const assignOptions = members
    .filter((m) => m.is_active && m.role !== "campaign_manager")
    .map((m) => ({
      value: m.id,
      label: `${m.name}${m.role === "team_leader" ? " · Team leader" : ""}`,
    }));

  const load = useCallback(async () => {
    const [membersRes, tasksRes] = await Promise.all([
      fetch(`/api/admin/members?key=${adminKey}`),
      fetch(`/api/admin/team/tasks?key=${adminKey}`),
    ]);
    const membersData = await membersRes.json();
    const tasksData = await tasksRes.json();
    setMembers(membersData.members || []);
    setTasks(tasksData.tasks || []);
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function createTask() {
    if (!form.title.trim() || !form.assignedTo) {
      showToast("Title and assignee required", "error");
      return;
    }
    const res = await fetch(`/api/admin/team/tasks?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        assignedTo: form.assignedTo,
        dueAt: form.dueAt || null,
      }),
    });
    const data = await res.json();
    if (data.error) showToast(data.error, "error");
    else {
      showToast("Task assigned");
      setForm({ title: "", description: "", assignedTo: form.assignedTo, dueAt: "" });
      load();
    }
  }

  async function updateStatus(taskId: string, status: string) {
    await fetch(`/api/admin/team/tasks?key=${adminKey}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ taskId, status }),
    });
    load();
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/admin/team/tasks?key=${adminKey}`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ taskId }),
    });
    load();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Team tasks</h1>
        <p className="text-sm text-lux-muted mt-1">
          Assign work to team leaders — they see tasks in their Leader workspace.
        </p>
      </div>

      {leaders.length === 0 && (
        <div className="lux-card p-4 border-amber-500/25 bg-amber-500/5 text-sm text-amber-200">
          No team leaders yet. Set a member&apos;s role to <strong>Team leader</strong> on the Team members page.
        </div>
      )}

      <div className="lux-card p-5 space-y-3">
        <h3 className="font-bricolage font-bold text-lux-text">New task</h3>
        <input
          className="lux-input"
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="lux-input min-h-[80px]"
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <LuxSelect
            value={form.assignedTo}
            onChange={(v) => setForm({ ...form, assignedTo: v })}
            options={[{ value: "", label: "Assign to…" }, ...assignOptions]}
          />
          <input
            className="lux-input"
            type="date"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
          />
        </div>
        <Button variant="lux" onClick={createTask} className="w-full sm:w-auto">
          Assign task
        </Button>
      </div>

      <div className="lux-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-lux-muted text-xs uppercase bg-lux-bg2 border-b border-white/[0.06]">
              <th className="text-left px-4 py-3 font-semibold">Task</th>
              <th className="text-left px-4 py-3 font-semibold">Assignee</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Due</th>
              <th className="text-left px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-lux-muted">
                  No tasks yet.
                </td>
              </tr>
            ) : (
              tasks.map((t) => (
                <tr key={t.id} className="border-b border-white/[0.06] last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-lux-text">{t.title}</div>
                    {t.description && <div className="text-xs text-lux-muted mt-0.5">{t.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-lux-muted">{t.assignee?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <LuxSelect
                      size="sm"
                      className="min-w-[130px]"
                      value={t.status}
                      onChange={(status) => updateStatus(t.id, status)}
                      options={statusOptions}
                    />
                  </td>
                  <td className="px-4 py-3 text-lux-muted text-xs">
                    {t.due_at ? formatDate(t.due_at) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="lux-ghost" size="sm" onClick={() => deleteTask(t.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
