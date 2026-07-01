import { NextRequest, NextResponse } from "next/server";
import { enrichThreads } from "@/lib/live-chat-server";
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return leader;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const leader = await requireChatAgent();
  if (leader instanceof NextResponse) return leader;

  const admin = createAdminClient();
  const { data: assigned } = await admin
    .from("live_chat_thread_leaders")
    .select("thread_id")
    .eq("thread_id", params.id)
    .eq("leader_id", leader.id)
    .maybeSingle();

  if (!assigned) {
    return NextResponse.json({ error: "Not assigned to this chat" }, { status: 403 });
  }

  const { data: messages, error } = await admin
    .from("live_chat_messages")
    .select("*")
    .eq("thread_id", params.id)
    .order("created_at", { ascending: true })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: thread } = await admin.from("live_chat_threads").select("*").eq("id", params.id).single();
  const [enriched] = thread ? await enrichThreads([thread]) : [null];

  return NextResponse.json({ thread: enriched, messages: messages || [] });
}
