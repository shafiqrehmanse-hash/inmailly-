import { NextRequest, NextResponse } from "next/server";
import { deleteClient } from "@/lib/admin-delete";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "10", 10) || 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const admin = createAdminClient();
  const { data: clients, error, count } = await admin
    .from("clients")
    .select(
      `*, projects(
        id, name, status, portal_token, inmail_package_size, created_at,
        inmail_subject, inmail_script, sales_nav_direct_link, sales_nav_link_count, branding_submitted_at,
        project_assignments(id)
      )`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const projectRows = (clients || []).flatMap((c) => {
    const rows = Array.isArray(c.projects) ? c.projects : [];
    const sorted = [...rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0]?.id ? [sorted[0].id] : [];
  });

  const pendingProjectIds = new Set<string>();
  if (projectRows.length > 0) {
    const { data: pendingBranding } = await admin
      .from("client_branding_requests")
      .select("project_id")
      .in("project_id", projectRows)
      .eq("status", "pending");
    for (const row of pendingBranding || []) {
      pendingProjectIds.add(row.project_id);
    }
  }

  const enriched = (clients || []).map((c) => {
    const projects = Array.isArray(c.projects) ? c.projects : [];
    const sorted = [...projects].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latest = sorted[0];
    const latest_project = latest
      ? {
          id: latest.id,
          name: latest.name,
          status: latest.status,
          portal_token: latest.portal_token,
          inmail_package_size: latest.inmail_package_size,
          assignee_count: Array.isArray(latest.project_assignments)
            ? latest.project_assignments.length
            : 0,
          branding_pending: pendingProjectIds.has(latest.id),
          branding_submitted: Boolean(latest.branding_submitted_at),
          inmail_subject: latest.inmail_subject,
          inmail_script: latest.inmail_script,
          sales_nav_direct_link: latest.sales_nav_direct_link,
          sales_nav_link_count: latest.sales_nav_link_count,
          branding_submitted_at: latest.branding_submitted_at,
        }
      : null;
    return {
      ...c,
      project_count: projects.length,
      latest_project,
      projects: undefined,
    };
  });

  return NextResponse.json({
    clients: enriched,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.max(1, Math.ceil((count || 0) / limit)),
    },
  });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, company_name, email, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .insert({
      name: name.trim(),
      company_name: company_name?.trim() || null,
      email: email?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ client: data });
}

export async function PATCH(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { client_id, name, company_name, email, notes, is_active } = body;

  if (!client_id) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) patch.name = name.trim();
  if (company_name !== undefined) patch.company_name = company_name?.trim() || null;
  if (email !== undefined) patch.email = email?.trim() || null;
  if (notes !== undefined) patch.notes = notes?.trim() || null;
  if (is_active !== undefined) patch.is_active = is_active;

  const admin = createAdminClient();
  const { error } = await admin.from("clients").update(patch).eq("id", client_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  try {
    const result = await deleteClient(admin, clientId);
    return NextResponse.json({
      success: true,
      deleted: result.name,
      email: result.email,
      projectsDeleted: result.projectsDeleted,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete client";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
