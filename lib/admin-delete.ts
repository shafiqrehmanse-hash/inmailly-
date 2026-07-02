import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;
const PROOF_BUCKET = "proof-screenshots";

async function deleteProjectProofs(admin: AdminClient, projectId: string) {
  const { data: proofs } = await admin
    .from("send_proofs")
    .select("original_path, display_path")
    .eq("project_id", projectId);

  const paths = (proofs || [])
    .flatMap((p) => [p.original_path, p.display_path])
    .filter((p): p is string => Boolean(p));

  if (paths.length > 0) {
    await admin.storage.from(PROOF_BUCKET).remove(paths);
  }
}

/** Permanently remove a project and its proofs, assignments, and contracts. */
export async function deleteProject(admin: AdminClient, projectId: string) {
  const { data: project } = await admin
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    throw new Error("Project not found");
  }

  await deleteProjectProofs(admin, projectId);
  await admin.from("leads").delete().eq("project_id", projectId);
  await admin.from("client_service_contracts").delete().eq("project_id", projectId);

  const { error } = await admin.from("projects").delete().eq("id", projectId);
  if (error) {
    throw new Error(error.message);
  }

  return { name: project.name };
}

/** Permanently remove a client, all projects, contracts, and auth account so the email can register again. */
export async function deleteClient(admin: AdminClient, clientId: string) {
  const { data: client } = await admin
    .from("clients")
    .select("id, user_id, email, name, company_name")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) {
    throw new Error("Client not found");
  }

  const { data: projects } = await admin.from("projects").select("id").eq("client_id", clientId);
  for (const project of projects || []) {
    await deleteProject(admin, project.id);
  }

  await admin.from("client_service_contracts").delete().eq("client_id", clientId);
  await admin.from("client_contract_terminations").delete().eq("client_id", clientId);

  const { error: clientError } = await admin.from("clients").delete().eq("id", clientId);
  if (clientError) {
    throw new Error(clientError.message);
  }

  if (client.user_id) {
    const { error: authError } = await admin.auth.admin.deleteUser(client.user_id);
    if (authError) {
      throw new Error(authError.message);
    }
  }

  return {
    email: client.email,
    name: client.company_name || client.name,
    projectsDeleted: projects?.length || 0,
  };
}
