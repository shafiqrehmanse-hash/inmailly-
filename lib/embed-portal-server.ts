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

  // Do not await — avoid adding write latency on every dashboard open
  if (!project.whitelabel_enabled) {
    void admin
      .from("projects")
      .update({ whitelabel_enabled: true, updated_at: new Date().toISOString() })
      .eq("id", project.id);
  }

  // Parallel reads — biggest speed win for white-label boards
  const [responsesRes, totalRes, interestedRes, proofRowsRes] = await Promise.all([
    admin
      .from("leads")
      .select(
        "id, name, company, position, profile_url, status, notes, client_followup_message, client_followup_at, created_at, updated_at"
      )
      .eq("project_id", project.id)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false })
      .limit(40),
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("visible_to_client", true),
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("visible_to_client", true)
      .in("status", ["interested", "replied"]),
    admin
      .from("send_proofs")
      .select("id, display_path, created_at")
      .eq("project_id", project.id)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  const proofs = await signedProofUrls(admin, proofRowsRes.data || []);

  return {
    project,
    stats: {
      total: totalRes.count || 0,
      interested: interestedRes.count || 0,
      sends: proofs.filter((p) => p.image_url).length,
    },
    responses: responsesRes.data || [],
    proofs: proofs.filter((p) => p.image_url),
  };
}
