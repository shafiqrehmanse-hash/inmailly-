import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

type AssignmentRow = {
  id: string;
  member_id: string;
  assigned_at: string;
  team_members: { id: string; name: string; email: string } | null;
};

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = request.nextUrl.searchParams.get("clientId");
  const admin = createAdminClient();

  let query = admin
    .from("projects")
    .select(
      `
      *,
      clients ( id, name, company_name, email ),
      project_assignments (
        id,
        member_id,
        assigned_at,
        team_members ( id, name, email )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const projects = (data || []).map((p) => {
    const assignments = (p.project_assignments as AssignmentRow[] | null) || [];
    return {
      ...p,
      project_assignments: undefined,
      assignments: assignments.map((a) => ({
        id: a.id,
        member_id: a.member_id,
        assigned_at: a.assigned_at,
        member: a.team_members,
      })),
      assignee_count: assignments.length,
    };
  });

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    client_id,
    name,
    audience_brief,
    target_titles,
    target_industries,
    target_regions,
    connection_script,
    inmail_script,
    followup_script,
    status,
    member_ids,
  } = body;

  if (!client_id || !name?.trim()) {
    return NextResponse.json({ error: "Client and project name are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: project, error } = await admin
    .from("projects")
    .insert({
      client_id,
      name: name.trim(),
      audience_brief: audience_brief?.trim() || null,
      target_titles: target_titles?.trim() || null,
      target_industries: target_industries?.trim() || null,
      target_regions: target_regions?.trim() || null,
      connection_script: connection_script?.trim() || null,
      inmail_script: inmail_script?.trim() || null,
      followup_script: followup_script?.trim() || null,
      status: status || "active",
    })
    .select()
    .single();

  if (error || !project) {
    return NextResponse.json({ error: error?.message || "Failed to create project" }, { status: 400 });
  }

  const ids: string[] = Array.isArray(member_ids) ? member_ids : [];
  if (ids.length > 0) {
    await admin.from("project_assignments").insert(
      ids.map((member_id: string) => ({
        project_id: project.id,
        member_id,
        assigned_by: "Admin",
      }))
    );
  }

  return NextResponse.json({ project });
}

export async function PATCH(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { project_id, member_ids, ...updates } = body;

  if (!project_id) {
    return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const fields = [
    "name",
    "audience_brief",
    "target_titles",
    "target_industries",
    "target_regions",
    "connection_script",
    "inmail_script",
    "followup_script",
    "status",
  ] as const;

  for (const field of fields) {
    if (updates[field] !== undefined) {
      patch[field] = typeof updates[field] === "string" ? updates[field].trim() || null : updates[field];
    }
  }

  if (Object.keys(patch).length > 1) {
    const { error } = await admin.from("projects").update(patch).eq("id", project_id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (Array.isArray(member_ids)) {
    await admin.from("project_assignments").delete().eq("project_id", project_id);
    if (member_ids.length > 0) {
      await admin.from("project_assignments").insert(
        member_ids.map((member_id: string) => ({
          project_id,
          member_id,
          assigned_by: "Admin",
        }))
      );
    }
  }

  return NextResponse.json({ success: true });
}
