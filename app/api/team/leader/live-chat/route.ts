import { NextRequest, NextResponse } from "next/server";
import { enrichThreads, touchMemberPresence } from "@/lib/live-chat-server";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireChatAgent() {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("team_members")
    .select("live_chat_agent")
    .eq("id", leader.id)
    .maybeSingle();

  if (!row?.live_chat_agent) {
    return NextResponse.json({ error: "Live chat access not granted by admin" }, { status: 403 });
  }
  return leader;
}

export async function GET() {
  const leader = await requireChatAgent();
  if (leader instanceof NextResponse) return leader;

  void touchMemberPresence(leader.id);

  const admin = createAdminClient();
  const { data: assignments } = await admin
    .from("live_chat_thread_leaders")
    .select("thread_id")
    .eq("leader_id", leader.id);

  const threadIds = (assignments || []).map((a) => a.thread_id);
  if (!threadIds.length) {
    return NextResponse.json({ threads: [] });
  }

  const { data: threads } = await admin
    .from("live_chat_threads")
    .select("*")
    .in("id", threadIds)
    .order("last_message_at", { ascending: false });

  const enriched = await enrichThreads(threads || []);
  return NextResponse.json({ threads: enriched });
}

export async function POST(request: NextRequest) {
  const leader = await requireChatAgent();
  if (leader instanceof NextResponse) return leader;

  const { threadId, body } = await request.json();
  if (!threadId || !body?.trim()) {
    return NextResponse.json({ error: "threadId and body required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: assigned } = await admin
    .from("live_chat_thread_leaders")
    .select("thread_id")
    .eq("thread_id", threadId)
    .eq("leader_id", leader.id)
    .maybeSingle();

  if (!assigned) {
    return NextResponse.json({ error: "This chat is not assigned to you" }, { status: 403 });
  }

  const { data: thread } = await admin
    .from("live_chat_threads")
    .select("id, status")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread || thread.status !== "open") {
    return NextResponse.json({ error: "Thread closed or not found" }, { status: 400 });
  }

  void touchMemberPresence(leader.id);

  const now = new Date().toISOString();
  const { data: message, error } = await admin
    .from("live_chat_messages")
    .insert({
      thread_id: threadId,
      sender_type: "leader",
      sender_member_id: leader.id,
      sender_name: leader.name,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin
    .from("live_chat_threads")
    .update({ last_message_at: now, updated_at: now })
    .eq("id", threadId);

  return NextResponse.json({ message });
}
