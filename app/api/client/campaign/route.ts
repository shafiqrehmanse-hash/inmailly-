import { NextResponse } from "next/server";
import { listCampaignProfilesForClient } from "@/lib/client-campaign-profiles";
import { getCurrentClient } from "@/lib/client-auth-server";
import { ensureClientHasProject } from "@/lib/ensure-client-project";
import { countProjectCampaignStats } from "@/lib/project-campaign-stats";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const project = await ensureClientHasProject(admin, client);
  if (!project) {
    return NextResponse.json({ error: "Could not load project" }, { status: 500 });
  }

  const { data: fullProject } = await admin
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
      inmail_package_size,
      inmail_subject,
      inmail_script,
      sales_nav_direct_link,
      sales_nav_link_count,
      branding_submitted_at,
      client_profile_links_parsed,
      client_profile_links_imported
    `
    )
    .eq("id", project.id)
    .maybeSingle();

  const stats = await countProjectCampaignStats(admin, project.id);

  const { data: pendingBranding } = await admin
    .from("client_branding_requests")
    .select("id, status, requested_at")
    .eq("client_id", client.id)
    .eq("project_id", project.id)
    .eq("status", "pending")
    .maybeSingle();

  const email = (client.email || "").toLowerCase();
  const clientFilter = email
    ? `client_id.eq.${client.id},contact_email.eq.${email}`
    : `client_id.eq.${client.id}`;

  const { data: contract } = await admin
    .from("client_service_contracts")
    .select("id, status, signed_at, created_at")
    .or(clientFilter)
    .in("status", ["pending_signature", "signed", "terminated"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let profiles: Awaited<ReturnType<typeof listCampaignProfilesForClient>> = [];
  try {
    profiles = await listCampaignProfilesForClient(admin, project.id);
  } catch {
    profiles = [];
  }

  const packageSize = fullProject?.inmail_package_size ?? null;
  const completed = stats.sends;
  const packageProgress =
    packageSize && packageSize > 0
      ? {
          target: packageSize,
          completed,
          percent: Math.min(100, (completed / packageSize) * 100),
        }
      : null;

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      company_name: client.company_name,
      email: client.email,
    },
    project: fullProject || project,
    stats: {
      total: stats.total,
      interested: stats.interested,
      sends: completed,
    },
    branding: {
      pending: Boolean(pendingBranding),
      submitted: Boolean(fullProject?.branding_submitted_at),
      submitted_at: fullProject?.branding_submitted_at || null,
      inmail_subject: fullProject?.inmail_subject || null,
      sales_nav_link_count: fullProject?.sales_nav_link_count || null,
      profile_links_parsed: fullProject?.client_profile_links_parsed || null,
      profile_links_imported: fullProject?.client_profile_links_imported || null,
    },
    contract: contract
      ? { id: contract.id, status: contract.status, signed_at: contract.signed_at }
      : null,
    packageProgress,
    profileCount: profiles.length,
    profiles,
    isPreview: fullProject?.status === "preview" || fullProject?.status === "draft",
  });
}
