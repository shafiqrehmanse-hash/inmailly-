import type { SupabaseClient } from "@supabase/supabase-js";
import { signedProofUrls } from "@/lib/proof-signed-urls";

/** Client-safe campaign payload for public embed (no team-only counts). */
export async function fetchEmbedPortalByToken(admin: SupabaseClient, token: string) {
  const { data: project, error } = await admin
    .from("projects")
    .select(
      `
      id,
      name,
      status,
      audience_brief,
      target_titles,
      inmail_package_size,
      whitelabel_enabled,
      embed_token,
      clients ( id, name, company_name, logo_url )
    `
    )
    .eq("embed_token", token)
    .maybeSingle();

  if (error || !project || !project.embed_token) return null;

  if (!project.whitelabel_enabled) {
    await admin
      .from("projects")
      .update({ whitelabel_enabled: true, updated_at: new Date().toISOString() })
      .eq("id", project.id);
  }

  const { data: responses } = await admin
    .from("leads")
    .select(
      "id, name, company, position, profile_url, status, notes, client_followup_message, client_followup_at, created_at, updated_at"
    )
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

  const proofs = await signedProofUrls(admin, proofRows || []);

  return {
    project,
    stats: {
      total: total || 0,
      interested: interested || 0,
      sends: proofs.filter((p) => p.image_url).length,
    },
    responses: responses || [],
    proofs: proofs.filter((p) => p.image_url),
  };
}
