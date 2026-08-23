import { NextResponse } from "next/server";
import { listCampaignProfilesForClient } from "@/lib/client-campaign-profiles";
import { getCurrentClient } from "@/lib/client-auth-server";
import { ensureClientHasProject } from "@/lib/ensure-client-project";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const project = await ensureClientHasProject(admin, client);
  if (!project) {
    return NextResponse.json({ error: "Could not load project" }, { status: 500 });
  }

  try {
    const profiles = await listCampaignProfilesForClient(admin, project.id);
    return NextResponse.json({
      project: { id: project.id, name: project.name },
      profiles,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load profiles";
    if (message.includes("client_campaign_profiles")) {
      return NextResponse.json({ project: { id: project.id, name: project.name }, profiles: [] });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
