import { createAdminClient } from "@/lib/supabase/admin";
import { LEADER_MANAGED_ROLES, isLeaderAssignableWorker, isTeamLeader } from "@/lib/roles";

/** Active outreach workers assigned to this team leader. */
export async function getLeaderAssignedWorkers(leaderId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members")
    .select("id, name, email, phone, photo_url, role, is_active, leader_id")
    .eq("is_active", true)
    .eq("leader_id", leaderId)
    .in("role", [...LEADER_MANAGED_ROLES])
    .order("name");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getLeaderAssignedWorkerIds(leaderId: string): Promise<string[]> {
  const workers = await getLeaderAssignedWorkers(leaderId);
  return workers.map((w) => w.id);
}

/** True if memberId is an active worker assigned to this leader. */
export async function leaderOwnsMember(leaderId: string, memberId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_members")
    .select("id, role, is_active, leader_id")
    .eq("id", memberId)
    .maybeSingle();

  if (!data?.is_active || !isLeaderAssignableWorker(data.role)) return false;
  return data.leader_id === leaderId;
}

/** Leaders visible to a worker (only their assigned leader). */
export async function getLeadersForWorker(workerId: string) {
  const admin = createAdminClient();
  const { data: worker } = await admin
    .from("team_members")
    .select("leader_id")
    .eq("id", workerId)
    .maybeSingle();

  if (!worker?.leader_id) return [];

  const { data: leader } = await admin
    .from("team_members")
    .select("id, name, email, phone, photo_url")
    .eq("id", worker.leader_id)
    .eq("role", "team_leader")
    .eq("is_active", true)
    .maybeSingle();

  return leader ? [leader] : [];
}

export async function assertIsTeamLeaderId(leaderId: string | null): Promise<boolean> {
  if (!leaderId) return true;
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_members")
    .select("id, role, is_active")
    .eq("id", leaderId)
    .maybeSingle();
  return Boolean(data?.is_active && isTeamLeader(data.role));
}
