import type { SupabaseClient } from "@supabase/supabase-js";

export type ProjectCampaignCounts = {
  total: number;
  teamResponses: number;
  interested: number;
  replied: number;
  sends: number;
  teamSends: number;
};

/** Exact row counts — never derive from a paginated preview list. */
export async function countProjectCampaignStats(
  admin: SupabaseClient,
  projectId: string
): Promise<ProjectCampaignCounts> {
  const [totalRes, teamResponsesRes, interestedRes, repliedRes, sendsRes, teamSendsRes] = await Promise.all([
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("visible_to_client", true),
    admin.from("leads").select("*", { count: "exact", head: true }).eq("project_id", projectId),
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("visible_to_client", true)
      .in("status", ["interested", "replied"]),
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("visible_to_client", true)
      .eq("status", "replied"),
    admin
      .from("send_proofs")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("visible_to_client", true),
    admin.from("send_proofs").select("*", { count: "exact", head: true }).eq("project_id", projectId),
  ]);

  return {
    total: totalRes.count || 0,
    teamResponses: teamResponsesRes.count || 0,
    interested: interestedRes.count || 0,
    replied: repliedRes.count || 0,
    sends: sendsRes.count || 0,
    teamSends: teamSendsRes.count || 0,
  };
}
