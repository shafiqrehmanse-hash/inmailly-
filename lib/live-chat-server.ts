import { createAdminClient } from "@/lib/supabase/admin";
import type { LiveChatThread } from "@/lib/live-chat";

export async function enrichThreads(threads: Record<string, unknown>[]): Promise<LiveChatThread[]> {
  if (!threads.length) return [];

  const admin = createAdminClient();
  const threadIds = threads.map((t) => t.id as string);
  const memberIds = Array.from(new Set(threads.map((t) => t.member_id as string)));

  const [{ data: members }, { data: assignments }, { data: msgs }] = await Promise.all([
    admin.from("team_members").select("id, name, email, role").in("id", memberIds),
    admin.from("live_chat_thread_leaders").select("thread_id, leader_id").in("thread_id", threadIds),
    admin
      .from("live_chat_messages")
      .select("thread_id, body, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false }),
  ]);

  const memberMap = Object.fromEntries((members || []).map((m) => [m.id, m]));
  const leaderIds = Array.from(new Set((assignments || []).map((a) => a.leader_id)));
  let leaderMap: Record<string, { id: string; name: string }> = {};
  if (leaderIds.length) {
    const { data: leaders } = await admin.from("team_members").select("id, name").in("id", leaderIds);
    leaderMap = Object.fromEntries((leaders || []).map((l) => [l.id, l]));
  }

  const assignByThread: Record<string, { id: string; name: string }[]> = {};
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
