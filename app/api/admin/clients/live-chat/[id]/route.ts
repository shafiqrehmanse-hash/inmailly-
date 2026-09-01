import { NextRequest, NextResponse } from "next/server";
import { notifyClientLiveChatReply } from "@/lib/email";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: messages, error } = await admin
    .from("client_live_chat_messages")
    .select("*")
    .eq("thread_id", params.id)
    .order("created_at", { ascending: true })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: messages || [] });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { body } = await request.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: thread } = await admin
    .from("client_live_chat_threads")
    .select("id, status, client_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!thread || thread.status !== "open") {
    return NextResponse.json({ error: "Thread not found or closed" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const preview = body.trim();
  const { data: message, error } = await admin
    .from("client_live_chat_messages")
    .insert({
      thread_id: params.id,
      sender_type: "admin",
      sender_name: "InMailly",
      body: preview,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin
    .from("client_live_chat_threads")
    .update({ last_message_at: now, updated_at: now })
    .eq("id", params.id);

  const { data: client } = await admin
    .from("clients")
    .select("name, email")
    .eq("id", thread.client_id)
    .maybeSingle();

  if (client?.email) {
    void notifyClientLiveChatReply({
      clientName: client.name,
      clientEmail: client.email,
      preview,
    });
  }

  return NextResponse.json({ message });
}
