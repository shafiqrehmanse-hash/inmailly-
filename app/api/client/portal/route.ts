import { NextRequest, NextResponse } from "next/server";
import { attachFollowupSequences } from "@/lib/client-followup-sequence";
import { listCampaignProfilesForClient } from "@/lib/client-campaign-profiles";
import { countProjectCampaignStats } from "@/lib/project-campaign-stats";
import { signedProofUrls } from "@/lib/proof-signed-urls";
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

  const [{ data: responses }, stats, { data: proofRows }] = await Promise.all([
    admin
      .from("leads")
      .select(
        "id, name, company, position, profile_url, status, notes, client_followup_message, client_followup_at, created_at, updated_at"
      )
      .eq("project_id", project.id)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false })
      .limit(100),
    countProjectCampaignStats(admin, project.id),
    admin
      .from("send_proofs")
      .select("id, display_path, created_at")
      .eq("project_id", project.id)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const proofs = await signedProofUrls(admin, proofRows || []);

  let profiles: Awaited<ReturnType<typeof listCampaignProfilesForClient>> = [];
  try {
    profiles = await listCampaignProfilesForClient(admin, project.id);
  } catch {
    profiles = [];
  }

  return NextResponse.json({
    project,
    stats,
    responses: await attachFollowupSequences(admin, responses || []),
    proofs: proofs.filter((p) => p.image_url),
    profiles,
  });
}
