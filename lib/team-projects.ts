import { createServerSupabase } from "@/lib/supabase/server";
import type { AssignedProject, Client, Project } from "@/lib/types";

type ProjectNested = Project & { clients: Client | Client[] | null };

function normalizeClient(
  clients: Client | Client[] | null | undefined
): AssignedProject["clients"] {
  if (!clients) return null;
  if (Array.isArray(clients)) return clients[0] ?? null;
  return {
    id: clients.id,
    name: clients.name,
    company_name: clients.company_name,
    email: clients.email,
    logo_url: clients.logo_url,
  };
}

function normalizeProject(
  projects: ProjectNested | ProjectNested[] | null | undefined
): ProjectNested | null {
  if (!projects) return null;
  if (Array.isArray(projects)) return projects[0] ?? null;
  return projects;
}

export async function getMemberAssignedProjects(memberId: string): Promise<AssignedProject[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("project_assignments")
    .select(
      `
      id,
      assigned_at,
      projects (
        id,
        client_id,
        name,
        audience_brief,
        target_titles,
        target_industries,
        target_regions,
        connection_script,
        inmail_script,
        followup_script,
        status,
        created_at,
        updated_at,
        clients (
          id,
          name,
          company_name,
          email,
          logo_url
        )
      )
    `
    )
    .eq("member_id", memberId)
    .order("assigned_at", { ascending: false });

  if (error || !data) return [];

  const results: AssignedProject[] = [];

  for (const row of data) {
    const project = normalizeProject(row.projects as ProjectNested | ProjectNested[] | null);
    if (!project) continue;
    results.push({
      ...project,
      clients: normalizeClient(project.clients),
      assignment_id: row.id,
      assigned_at: row.assigned_at,
    });
  }

  return results;
}

export async function getMemberProject(
  memberId: string,
  projectId: string
): Promise<AssignedProject | null> {
  const projects = await getMemberAssignedProjects(memberId);
  return projects.find((p) => p.id === projectId) ?? null;
}
