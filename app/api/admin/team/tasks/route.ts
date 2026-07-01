import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const assigneeId = request.nextUrl.searchParams.get("assigneeId");

  let query = admin.from("team_tasks").select("*").order("created_at", { ascending: false }).limit(100);

  if (assigneeId) {
    query = query.eq("assigned_to", assigneeId);
  }

  const { data: tasks, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const assigneeIds = Array.from(new Set((tasks || []).map((t) => t.assigned_to)));
  let assignees: Record<string, { id: string; name: string; email: string; role: string }> = {};
  if (assigneeIds.length > 0) {
    const { data: members } = await admin
      .from("team_members")
      .select("id, name, email, role")
      .in("id", assigneeIds);
    assignees = Object.fromEntries((members || []).map((m) => [m.id, m]));
  }

  const enriched = (tasks || []).map((t) => ({
    ...t,
    assignee: assignees[t.assigned_to] || null,
  }));

  return NextResponse.json({ tasks: enriched });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, assignedTo, dueAt } = await request.json();
  if (!title?.trim() || !assignedTo) {
    return NextResponse.json({ error: "title and assignedTo required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_tasks")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      assigned_to: assignedTo,
      due_at: dueAt || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}

export async function PATCH(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId, title, description, assignedTo, status, dueAt } = await request.json();
  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title?.trim()) updates.title = title.trim();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (assignedTo) updates.assigned_to = assignedTo;
  if (status) updates.status = status;
  if (dueAt !== undefined) updates.due_at = dueAt || null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await request.json();
  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("team_tasks").delete().eq("id", taskId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
