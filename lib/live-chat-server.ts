import { createAdminClient } from "@/lib/supabase/admin";
import { isRecentlyOnline, type LiveChatPerson, type LiveChatThread } from "@/lib/live-chat";

function withPresence<T extends { id: string; name: string; last_login?: string | null }>(
  row: T
): LiveChatPerson {
  return {
    id: row.id,
    name: row.name,
    email: (row as LiveChatPerson).email,
    role: (row as LiveChatPerson).role,
    last_login: row.last_login ?? null,
    is_online: isRecentlyOnline(row.last_login),
  };
}

export async function enrichThreads(threads: Record<string, unknown>[]): Promise<LiveChatThread[]> {
  if (!threads.length) return [];

  const admin = createAdminClient();
  const threadIds = threads.map((t) => t.id as string);
  const memberIds = Array.from(new Set(threads.map((t) => t.member_id as string)));

  const [{ data: members }, { data: assignments }, { data: msgs }] = await Promise.all([
    admin.from("team_members").select("id, name, email, role, last_login").in("id", memberIds),
    admin.from("live_chat_thread_leaders").select("thread_id, leader_id").in("thread_id", threadIds),
    admin
      .from("live_chat_messages")
      .select("thread_id, body, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false }),
  ]);

  const memberMap = Object.fromEntries((members || []).map((m) => [m.id, withPresence(m)]));
  const leaderIds = Array.from(new Set((assignments || []).map((a) => a.leader_id)));
  let leaderMap: Record<string, LiveChatPerson> = {};
  if (leaderIds.length) {
    const { data: leaders } = await admin
      .from("team_members")
      .select("id, name, last_login")
      .in("id", leaderIds);
    leaderMap = Object.fromEntries((leaders || []).map((l) => [l.id, withPresence(l)]));
  }

  const assignByThread: Record<string, LiveChatPerson[]> = {};
  for (const a of assignments || []) {
    const leader = leaderMap[a.leader_id];
    if (!leader) continue;
    if (!assignByThread[a.thread_id]) assignByThread[a.thread_id] = [];
    assignByThread[a.thread_id].push(leader);
  }

  const lastByThread: Record<string, string> = {};
  for (const m of msgs || []) {
    if (!lastByThread[m.thread_id]) lastByThread[m.thread_id] = m.body;
  }

  return threads.map((t) => ({
    ...(t as LiveChatThread),
    member: memberMap[t.member_id as string] || undefined,
    assigned_leaders: assignByThread[t.id as string] || [],
    last_message: lastByThread[t.id as string] || null,
  }));
}

/** Keep presence fresh while chat is open / polling. */
export async function touchMemberPresence(memberId: string) {
  const admin = createAdminClient();
  await admin
    .from("team_members")
    .update({ last_login: new Date().toISOString() })
    .eq("id", memberId);
}

export async function getOrCreateOpenThread(memberId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("live_chat_threads")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "open")
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await admin
    .from("live_chat_threads")
    .insert({ member_id: memberId, status: "open" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created;
}

/** Pick the active chat agent with the fewest open thread assignments (round-robin load balance). */
async function pickChatAgent(
  admin: ReturnType<typeof createAdminClient>
): Promise<{ id: string; name: string } | null> {
  const { data: agents } = await admin
    .from("team_members")
    .select("id, name")
    .eq("role", "team_leader")
    .eq("is_active", true)
    .eq("live_chat_agent", true)
    .order("name");

  if (!agents?.length) return null;

  const { data: openThreads } = await admin.from("live_chat_threads").select("id").eq("status", "open");
  const openIds = new Set((openThreads || []).map((t) => t.id));
  if (!openIds.size) return agents[0];

  const { data: assignments } = await admin
    .from("live_chat_thread_leaders")
    .select("thread_id, leader_id")
    .in("thread_id", Array.from(openIds));

  const load: Record<string, number> = Object.fromEntries(agents.map((a) => [a.id, 0]));
  for (const row of assignments || []) {
    if (load[row.leader_id] !== undefined) load[row.leader_id]++;
  }

  return agents.reduce((best, a) => (load[a.id] < load[best.id] ? a : best));
}

/**
 * When a member messages and no leader is assigned yet, auto-route to their
 * assigned team leader (if chat agent), otherwise any granted chat agent.
 */
export async function autoAssignThreadIfNeeded(threadId: string): Promise<{ id: string; name: string }[]> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("live_chat_thread_leaders")
    .select("leader_id")
    .eq("thread_id", threadId);

  if (existing?.length) {
    const ids = existing.map((r) => r.leader_id);
    const { data: leaders } = await admin.from("team_members").select("id, name").in("id", ids);
    return leaders || [];
  }

  const { data: thread } = await admin
    .from("live_chat_threads")
    .select("member_id")
    .eq("id", threadId)
    .maybeSingle();

  let agent: { id: string; name: string } | null = null;

  if (thread?.member_id) {
    const { data: worker } = await admin
      .from("team_members")
      .select("leader_id")
      .eq("id", thread.member_id)
      .maybeSingle();

    if (worker?.leader_id) {
      const { data: ownLeader } = await admin
        .from("team_members")
        .select("id, name")
        .eq("id", worker.leader_id)
        .eq("role", "team_leader")
        .eq("is_active", true)
        .eq("live_chat_agent", true)
        .maybeSingle();
      if (ownLeader) agent = ownLeader;
    }
  }

  if (!agent) agent = await pickChatAgent(admin);
  if (!agent) return [];

  const { error } = await admin.from("live_chat_thread_leaders").insert({
    thread_id: threadId,
    leader_id: agent.id,
  });

  if (error) return [];
  return [agent];
}
