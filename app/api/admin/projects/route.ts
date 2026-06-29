import { NextRequest, NextResponse } from "next/server";
import { getClientEmailForProject, notifyClientCampaignLive } from "@/lib/email";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import { randomToken } from "@/lib/utils";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

function parsePackageSize(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

async function validateCampaignManagerIds(
  admin: ReturnType<typeof createAdminClient>,
  memberIds: string[]
) {
  if (memberIds.length === 0) return null;

  const { data, error } = await admin
    .from("team_members")
    .select("id, name, role, is_active")
    .in("id", memberIds);

  if (error) return error.message;
  if ((data?.length || 0) !== memberIds.length) {
    return "One or more assignees were not found";
  }

  const invalid = (data || []).filter((m) => m.role !== "campaign_manager");
  if (invalid.length > 0) {
    return `${invalid.map((m) => m.name).join(", ")} must have role Campaign manager`;
  }

  const inactive = (data || []).filter((m) => !m.is_active);
  if (inactive.length > 0) {
    return `${inactive.map((m) => m.name).join(", ")} is inactive — activate them in Team tab first`;
  }

  return null;
}

async function syncProjectAssignments(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
  memberIds: string[]
) {
  const validationError = await validateCampaignManagerIds(admin, memberIds);
  if (validationError) return validationError;

  const { error: deleteError } = await admin
    .from("project_assignments")
    .delete()
    .eq("project_id", projectId);
  if (deleteError) return deleteError.message;

  if (memberIds.length === 0) return null;

  const { error: insertError } = await admin.from("project_assignments").insert(
    memberIds.map((member_id) => ({
      project_id: projectId,
      member_id,
      assigned_by: "Admin",
    }))
  );
  if (insertError) return insertError.message;

  return null;
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
    inmail_package_size,
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
      inmail_package_size: parsePackageSize(inmail_package_size),
      portal_token: randomToken(),
    })
    .select()
    .single();

  if (error || !project) {
    return NextResponse.json({ error: error?.message || "Failed to create project" }, { status: 400 });
  }

  const ids: string[] = Array.isArray(member_ids) ? member_ids : [];
  const assignError = await syncProjectAssignments(admin, project.id, ids);
  if (assignError) {
    await admin.from("projects").delete().eq("id", project.id);
    return NextResponse.json({ error: assignError }, { status: 400 });
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

  const { data: existing } = await admin
    .from("projects")
    .select("status")
    .eq("id", project_id)
    .maybeSingle();

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

  if (updates.inmail_package_size !== undefined) {
    patch.inmail_package_size = parsePackageSize(updates.inmail_package_size);
  }

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

    const newStatus = updates.status as string | undefined;
    if (newStatus === "active" && existing?.status !== "active") {
      const client = await getClientEmailForProject(project_id);
      if (client.email) {
        void notifyClientCampaignLive({
          email: client.email,
          clientName: client.clientName,
          projectName: client.projectName,
        });
      }
    }
  }

  if (Array.isArray(member_ids)) {
    const assignError = await syncProjectAssignments(admin, project_id, member_ids);
    if (assignError) {
      return NextResponse.json({ error: assignError }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
