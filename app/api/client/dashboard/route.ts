import { NextResponse } from "next/server";
import { getCurrentClient } from "@/lib/client-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const client = await getCurrentClient();
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const admin = createAdminClient();

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, name, status, audience_brief, target_titles, portal_token, created_at, clients ( id, name, company_name )"
    )
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const project = projects?.[0];
  if (!project) {
    return NextResponse.json({ error: "No project found" }, { status: 404 });
  }

  const { data: responses } = await admin
    .from("leads")
    .select("id, name, company, position, status, notes, created_at")
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
      clients: clientRow,
    },
    stats: {
      total: total || 0,
      interested: interested || 0,
      sends: proofs.filter((p) => p.image_url).length,
    },
    responses: responses || [],
    proofs: proofs.filter((p) => p.image_url),
    isPreview: project.status === "preview" || project.status === "draft",
  });
}
