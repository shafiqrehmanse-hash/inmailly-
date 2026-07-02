import { NextResponse } from "next/server";
import { getCurrentClient } from "@/lib/client-auth-server";
import { ensureClientHasProject } from "@/lib/ensure-client-project";
import { getSiteUrl } from "@/lib/site-url";
import { whitelabelDownloadFilename } from "@/lib/whitelabel-html";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomToken } from "@/lib/utils";

async function hasSignedContract(admin: ReturnType<typeof createAdminClient>, clientId: string, email: string) {
  const filter = email
    ? `client_id.eq.${clientId},contact_email.eq.${email.toLowerCase()}`
    : `client_id.eq.${clientId}`;
  const { data } = await admin
    .from("client_service_contracts")
    .select("id")
    .or(filter)
    .eq("status", "signed")
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

export async function GET() {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const project = await ensureClientHasProject(admin, client);
  if (!project) {
    return NextResponse.json({ error: "No project found" }, { status: 404 });
  }

  const email = (client.email || "").toLowerCase();
  const signed = await hasSignedContract(admin, client.id, email);
  const projectActive = project.status === "active";
  const eligible = signed || projectActive;

  let embedToken = (project as { embed_token?: string | null }).embed_token ?? null;
  let whitelabelEnabled = (project as { whitelabel_enabled?: boolean }).whitelabel_enabled ?? false;

  if (eligible && !embedToken) {
    embedToken = randomToken();
    await admin
      .from("projects")
      .update({
        embed_token: embedToken,
        whitelabel_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);
    whitelabelEnabled = true;
  }

  const companyName = client.company_name || client.name;
  const siteUrl = getSiteUrl();
  const embedUrl = embedToken ? `${siteUrl}/embed/campaign/${embedToken}` : null;

  return NextResponse.json({
    eligible,
    signed,
    projectActive,
    whitelabelEnabled: Boolean(whitelabelEnabled && embedToken),
    embedToken,
    embedUrl,
    projectName: project.name,
    companyName,
    filename: whitelabelDownloadFilename(companyName),
    needsContract: !signed && !projectActive,
  });
}
