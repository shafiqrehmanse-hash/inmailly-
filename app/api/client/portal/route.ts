import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: project, error } = await admin
    .from("projects")
    .select(
      `
      id,
      name,
      status,
      audience_brief,
      target_titles,
      target_industries,
      target_regions,
      portal_token,
      clients ( id, name, company_name, email, logo_url )
    `
    )
    .eq("portal_token", token)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: responses } = await admin
    .from("leads")
    .select("id, name, company, position, profile_url, status, notes, created_at, updated_at")
    .eq("project_id", project.id)
    .eq("visible_to_client", true)
    .order("created_at", { ascending: false })
    .limit(100);

  const { count: total } = await admin
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id)
    .eq("visible_to_client", true);

  const { count: interested } = await admin
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id)
    .eq("visible_to_client", true)
    .in("status", ["interested", "replied"]);

  return NextResponse.json({
    project,
    stats: {
      total: total || 0,
      interested: interested || 0,
    },
    responses: responses || [],
  });
}
