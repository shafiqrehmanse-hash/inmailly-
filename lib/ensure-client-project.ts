import type { SupabaseClient } from "@supabase/supabase-js";
import { randomToken } from "@/lib/utils";

const PROJECT_SELECT =
  "id, name, status, audience_brief, target_titles, portal_token, inmail_package_size, created_at, clients ( id, name, company_name )";

export type ClientProjectRow = {
  id: string;
  name: string;
  status: string;
  audience_brief: string | null;
  target_titles: string | null;
  portal_token: string;
  inmail_package_size: number | null;
  created_at: string;
  clients: { id: string; name: string; company_name: string | null } | { id: string; name: string; company_name: string | null }[] | null;
};

type ClientRef = {
  id: string;
  name: string;
  email: string | null;
  company_name: string | null;
};

const PREVIEW_BRIEF =
  "Your preview dashboard — book a call with InMailly to launch a live campaign with your audience and scripts.";

async function fetchLatestProject(admin: SupabaseClient, clientId: string) {
  const { data } = await admin
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as ClientProjectRow | null;
}

async function reconcileDuplicateClientProjects(admin: SupabaseClient, client: ClientRef) {
  if (!client.email?.trim()) return;

  const normalizedEmail = client.email.trim().toLowerCase();
  const { data: dupes } = await admin
    .from("clients")
    .select("id")
    .ilike("email", normalizedEmail)
    .neq("id", client.id);

  for (const dupe of dupes || []) {
    await admin.from("projects").update({ client_id: client.id }).eq("client_id", dupe.id);
  }
}

/** Ensures the client has at least one project (preview if needed). Reassigns projects from duplicate email rows. */
export async function ensureClientHasProject(
  admin: SupabaseClient,
  client: ClientRef
): Promise<ClientProjectRow | null> {
  let project = await fetchLatestProject(admin, client.id);
  if (project) return project;

  await reconcileDuplicateClientProjects(admin, client);
  project = await fetchLatestProject(admin, client.id);
  if (project) return project;

  const projectName = client.company_name
    ? `${client.company_name} Campaign`
    : `${client.name.trim().split(" ")[0] || "Your"}'s Campaign`;

  const { data: created, error } = await admin
    .from("projects")
    .insert({
      client_id: client.id,
      name: projectName,
      status: "preview",
      audience_brief: PREVIEW_BRIEF,
      portal_token: randomToken(),
    })
    .select(PROJECT_SELECT)
    .single();

  if (error || !created) return null;
  return created as ClientProjectRow;
}
