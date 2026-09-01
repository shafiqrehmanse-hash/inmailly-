import { NextRequest, NextResponse } from "next/server";
import { notifyAdminClientLiveChat } from "@/lib/email";
import { getCurrentClient } from "@/lib/client-auth-server";
import { getOrCreateClientOpenThread } from "@/lib/client-live-chat-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const admin = createAdminClient();
    const thread = await getOrCreateClientOpenThread(client.id);
    const { data: messages } = await admin
      .from("client_live_chat_messages")
      .select("*")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true })
      .limit(200);

    return NextResponse.json({ thread, messages: messages || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not open chat";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body } = await request.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const thread = await getOrCreateClientOpenThread(client.id);
    const now = new Date().toISOString();
    const preview = body.trim();

    const { data: message, error } = await admin
      .from("client_live_chat_messages")
      .insert({
        thread_id: thread.id,
        sender_type: "client",
        sender_name: client.name,
        body: preview,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await admin
      .from("client_live_chat_threads")
      .update({ last_message_at: now, updated_at: now, status: "open" })
      .eq("id", thread.id);

    void notifyAdminClientLiveChat({
      clientName: client.name,
      clientEmail: client.email || "",
      company: client.company_name,
      preview,
    }).then((result) => {
      if (!result.ok && !("skipped" in result && result.skipped)) {
        console.error("[email] client live chat notify failed:", "error" in result ? result.error : "unknown");
      }
    });

    return NextResponse.json({ message });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not send";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
