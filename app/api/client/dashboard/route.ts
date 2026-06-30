import { NextResponse } from "next/server";
import { getCurrentClient } from "@/lib/client-auth-server";
import { ensureClientHasProject } from "@/lib/ensure-client-project";
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

  const { data: responses } = await admin
    .from("leads")
    .select("id, name, company, position, profile_url, status, notes, client_followup_message, client_followup_at, created_at")
    .eq("project_id", project.id)
    .eq("visible_to_client", true)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: proofRows } = await admin
    .from("send_proofs")
    .select("id, display_path, created_at")
    .eq("project_id", project.id)
    .eq("visible_to_client", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const proofs = await Promise.all(
    (proofRows || []).map(async (p) => {
      const { data } = await admin.storage.from("proof-screenshots").createSignedUrl(p.display_path, 3600);
      return {
        id: p.id,
        image_url: data?.signedUrl || null,
        created_at: p.created_at,
      };
    })
  );

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

  const { count: teamResponses } = await admin
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id);

  const { count: teamProofs } = await admin
    .from("send_proofs")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id);

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
      portal_token: project.portal_token,
      inmail_package_size: project.inmail_package_size,
      clients: clientRow,
    },
    stats: {
      total: total || 0,
      teamResponses: teamResponses || 0,
      interested: interested || 0,
      sends: proofs.filter((p) => p.image_url).length,
      teamSends: teamProofs || 0,
    },
    responses: responses || [],
    proofs: proofs.filter((p) => p.image_url),
    isPreview: project.status === "preview" || project.status === "draft",
  });
}
