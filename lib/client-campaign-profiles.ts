import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type ClientCampaignProfileRow = {
  id: string;
  project_id: string;
  client_id: string;
  display_name: string;
  headline: string | null;
  title: string | null;
  linkedin_url: string | null;
  profile_photo_data: string | null;
  cover_photo_data: string | null;
  card_preview_data: string | null;
  sort_order: number;
  visible_to_client: boolean;
  created_at: string;
};

export type ClientCampaignProfilePublic = Omit<
  ClientCampaignProfileRow,
  "visible_to_client" | "client_id" | "project_id"
>;

function toPublic(row: ClientCampaignProfileRow): ClientCampaignProfilePublic {
  return {
    id: row.id,
    display_name: row.display_name,
    headline: row.headline,
    title: row.title,
    linkedin_url: row.linkedin_url,
    profile_photo_data: row.profile_photo_data,
    cover_photo_data: row.cover_photo_data,
    card_preview_data: row.card_preview_data,
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

export async function listCampaignProfilesForProject(
  admin: AdminClient,
  projectId: string,
  options?: { clientVisibleOnly?: boolean }
) {
  let query = admin
    .from("client_campaign_profiles")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (options?.clientVisibleOnly) {
    query = query.eq("visible_to_client", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as ClientCampaignProfileRow[];
}

export async function listCampaignProfilesForClient(
  admin: AdminClient,
  projectId: string
): Promise<ClientCampaignProfilePublic[]> {
  const rows = await listCampaignProfilesForProject(admin, projectId, { clientVisibleOnly: true });
  return rows.map(toPublic);
}

export async function createCampaignProfile(
  admin: AdminClient,
  input: {
    project_id: string;
    client_id: string;
    display_name: string;
    headline?: string | null;
    title?: string | null;
    linkedin_url?: string | null;
    profile_photo_data?: string | null;
    cover_photo_data?: string | null;
    card_preview_data?: string | null;
    sort_order?: number;
  }
) {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("client_campaign_profiles")
    .insert({
      project_id: input.project_id,
      client_id: input.client_id,
      display_name: input.display_name.trim(),
      headline: input.headline?.trim() || null,
      title: input.title?.trim() || null,
      linkedin_url: input.linkedin_url?.trim() || null,
      profile_photo_data: input.profile_photo_data || null,
      cover_photo_data: input.cover_photo_data || null,
      card_preview_data: input.card_preview_data || null,
      sort_order: input.sort_order ?? 0,
      visible_to_client: true,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ClientCampaignProfileRow;
}

export async function deleteCampaignProfile(admin: AdminClient, profileId: string, projectId: string) {
  const { error } = await admin
    .from("client_campaign_profiles")
    .delete()
    .eq("id", profileId)
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);
}
