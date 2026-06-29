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
  const { data: clients, error } = await admin
    .from("clients")
    .select("*, projects(id, name, status, portal_token, created_at)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = (clients || []).map((c) => {
    const projectRows = Array.isArray(c.projects) ? c.projects : [];
    const sorted = [...projectRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latest_project = sorted[0] || null;
    return {
      ...c,
      project_count: projectRows.length,
      latest_project,
      projects: undefined,
    };
  });

  return NextResponse.json({ clients: enriched });
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
  const { count } = await admin
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  if ((count || 0) > 0) {
    return NextResponse.json(
      { error: "Remove or reassign all projects before deleting this client." },
      { status: 400 }
    );
  }

  const { error } = await admin.from("clients").delete().eq("id", clientId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
