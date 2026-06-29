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
      inmail_package_size,
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

  const { data: proofRows } = await admin
    .from("send_proofs")
    .select("id, display_path, created_at")
    .eq("project_id", project.id)
    .eq("visible_to_client", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const proofs = await Promise.all(
    (proofRows || []).map(async (p) => {
      const { data } = await admin.storage
        .from("proof-screenshots")
        .createSignedUrl(p.display_path, 3600);
      return {
        id: p.id,
        image_url: data?.signedUrl || null,
        created_at: p.created_at,
      };
    })
  );

  const { count: teamResponses } = await admin
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id);

  const { count: teamProofs } = await admin
    .from("send_proofs")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id);

  return NextResponse.json({
    project,
    stats: {
      total: total || 0,
      teamResponses: teamResponses || 0,
      interested: interested || 0,
      sends: proofs.filter((p) => p.image_url).length,
      teamSends: teamProofs || 0,
    },
    responses: responses || [],
    proofs: proofs.filter((p) => p.image_url),
  });
}
