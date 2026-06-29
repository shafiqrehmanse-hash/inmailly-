import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AssignedProject, Client, Project } from "@/lib/types";

type ProjectNested = Project & { clients: Client | Client[] | null };

const ASSIGNMENT_SELECT = `
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
    portal_token,
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
`;

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

type AssignmentRow = {
  id: string;
  assigned_at: string;
  projects: ProjectNested | ProjectNested[] | null;
};

function mapAssignmentRows(data: AssignmentRow[]): AssignedProject[] {
  const results: AssignedProject[] = [];

  for (const row of data) {
    const project = normalizeProject(row.projects);
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

async function assertMemberBelongsToUser(memberId: string, userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_members")
    .select("id")
    .eq("id", memberId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function getMemberAssignedProjects(memberId: string): Promise<AssignedProject[]> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  if (!(await assertMemberBelongsToUser(memberId, user.id))) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("project_assignments")
    .select(ASSIGNMENT_SELECT)
    .eq("member_id", memberId)
    .order("assigned_at", { ascending: false });

  if (error || !data) {
    console.error("getMemberAssignedProjects:", error?.message);
    return [];
  }

  return mapAssignmentRows(data as AssignmentRow[]);
}

export async function getMemberProject(
  memberId: string,
  projectId: string
): Promise<AssignedProject | null> {
  const projects = await getMemberAssignedProjects(memberId);
  return projects.find((p) => p.id === projectId) ?? null;
}
