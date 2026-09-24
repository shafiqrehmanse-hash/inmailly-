import { NextResponse } from "next/server";
import { getCurrentClient } from "@/lib/client-auth-server";
import { attachFollowupSequences } from "@/lib/client-followup-sequence";
import { ensureClientHasProject } from "@/lib/ensure-client-project";
import { countProjectCampaignStats } from "@/lib/project-campaign-stats";
import { signedProofUrls } from "@/lib/proof-signed-urls";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const client = await getCurrentClient();
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const project = await ensureClientHasProject(admin, client);
  if (!project) {
    return NextResponse.json({ error: "Could not load your project. Please try again." }, { status: 500 });
  }

  const { data: responsesRaw, error: responsesError } = await admin
    .from("leads")
    .select("id, name, company, position, profile_url, status, notes, client_followup_message, client_followup_at, created_at")
    .eq("project_id", project.id)
    .eq("visible_to_client", true)
    .order("created_at", { ascending: false })
    .limit(100);

  let responses = responsesRaw;
  if (responsesError?.message?.includes("client_followup")) {
    const { data: fallback } = await admin
      .from("leads")
      .select("id, name, company, position, profile_url, status, notes, created_at")
      .eq("project_id", project.id)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false })
      .limit(100);
    responses = (fallback || []).map((r) => ({
      ...r,
      client_followup_message: null,
      client_followup_at: null,
    }));
  }

  const withSequence = await attachFollowupSequences(admin, responses || []);

  const [{ data: proofRows }, stats] = await Promise.all([
    admin
      .from("send_proofs")
      .select("id, display_path, created_at")
      .eq("project_id", project.id)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false })
      .limit(50),
    countProjectCampaignStats(admin, project.id),
  ]);

  const proofs = await signedProofUrls(admin, proofRows || []);

  const clients = project.clients as { name: string; company_name: string | null } | { name: string; company_name: string | null }[] | null;
  const clientRow = Array.isArray(clients) ? clients[0] : clients;

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      company_name: client.company_name,
      signup_source: client.signup_source,
    },
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
      audience_brief: project.audience_brief,
      target_titles: project.target_titles,
      target_industries: project.target_industries ?? null,
      target_regions: project.target_regions ?? null,
      portal_token: project.portal_token,
      inmail_package_size: project.inmail_package_size,
      clients: clientRow,
    },
    stats,
    responses: withSequence,
    proofs: proofs.filter((p) => p.image_url),
    isPreview: project.status === "preview" || project.status === "draft",
  });
}
