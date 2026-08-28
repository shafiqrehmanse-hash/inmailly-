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

/**
 * Route a member chat to their assigned team leader only (not other leaders).
 */
export async function autoAssignThreadIfNeeded(threadId: string): Promise<{ id: string; name: string; email: string }[]> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("live_chat_thread_leaders")
    .select("leader_id")
    .eq("thread_id", threadId);

  if (existing?.length) {
    const ids = existing.map((r) => r.leader_id);
    const { data: leaders } = await admin.from("team_members").select("id, name, email").in("id", ids);
    return (leaders || []) as { id: string; name: string; email: string }[];
  }

  const { data: thread } = await admin
    .from("live_chat_threads")
    .select("member_id")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread?.member_id) return [];

  const { data: worker } = await admin
    .from("team_members")
    .select("leader_id")
    .eq("id", thread.member_id)
    .maybeSingle();

  if (!worker?.leader_id) return [];

  const { data: ownLeader } = await admin
    .from("team_members")
    .select("id, name, email")
    .eq("id", worker.leader_id)
    .eq("role", "team_leader")
    .eq("is_active", true)
    .maybeSingle();

  if (!ownLeader) return [];

  const { error } = await admin.from("live_chat_thread_leaders").insert({
    thread_id: threadId,
    leader_id: ownLeader.id,
  });

  if (error) return [];
  return [ownLeader];
}
