import { NextRequest, NextResponse } from "next/server";
import { isLeaderAssignableWorker } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

export async function GET() {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const admin = createAdminClient();
  const { data: tasks, error } = await admin
    .from("team_tasks")
    .select("*")
    .eq("assigned_by_member_id", leader.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const assigneeIds = Array.from(new Set((tasks || []).map((t) => t.assigned_to)));
  let assignees: Record<string, { id: string; name: string; email: string }> = {};
  if (assigneeIds.length > 0) {
    const { data: members } = await admin
      .from("team_members")
      .select("id, name, email")
      .in("id", assigneeIds);
    assignees = Object.fromEntries((members || []).map((m) => [m.id, m]));
  }

  return NextResponse.json({
    tasks: (tasks || []).map((t) => ({ ...t, assignee: assignees[t.assigned_to] || null })),
  });
}

export async function POST(request: NextRequest) {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const { title, description, assignedTo, dueAt } = await request.json();
  if (!title?.trim() || !assignedTo) {
    return NextResponse.json({ error: "title and assignedTo required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: assignee } = await admin
    .from("team_members")
    .select("id, role, is_active")
    .eq("id", assignedTo)
    .maybeSingle();

  if (!assignee?.is_active || !isLeaderAssignableWorker(assignee.role)) {
    return NextResponse.json({ error: "Can only assign to active outreach workers" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("team_tasks")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      assigned_to: assignedTo,
      assigned_by_member_id: leader.id,
      due_at: dueAt || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
