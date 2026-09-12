import { NextRequest, NextResponse } from "next/server";
import { appendLeadReplyAndNextSend } from "@/lib/client-followup-sequence";
import { getCurrentClient } from "@/lib/client-auth-server";
import { notifyTeamClientFollowup } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

type Item = { lead_id?: string; lead_reply?: string; next_followup?: string };

function validText(s: string | undefined, min = 8) {
  const t = s?.trim() || "";
  return t.length >= min && t.length <= 4000 ? t : null;
}

export async function POST(request: NextRequest) {
  const client = await getCurrentClient();
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const items: Item[] = Array.isArray(body.items) ? body.items : [];
  if (!items.length) {
    return NextResponse.json({ error: "Select at least one lead" }, { status: 400 });
  }

  const admin = createAdminClient();
  const saved: { id: string; client_followup_message: string; client_followup_at: string }[] = [];
  const names: string[] = [];

  for (const item of items) {
    const leadId = String(item.lead_id || "").trim();
    const leadReply = validText(item.lead_reply);
    const nextFollowup = validText(item.next_followup, 10);
    if (!leadId || !leadReply || !nextFollowup) {
      return NextResponse.json(
        { error: "Each selected lead needs their reply (8+ chars) and your next follow-up (10+ chars)." },
        { status: 400 }
      );
    }

    const { data: lead } = await admin
      .from("leads")
      .select("id, name, project_id, visible_to_client, client_followup_message")
      .eq("id", leadId)
      .maybeSingle();

    if (!lead?.project_id || !lead.visible_to_client) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const { data: project } = await admin
      .from("projects")
      .select("id, name, client_id")
      .eq("id", lead.project_id)
      .maybeSingle();

    if (!project || project.client_id !== client.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!lead.client_followup_message) {
      return NextResponse.json(
        { error: `Send the first follow-up for ${lead.name} before adding their next reply.` },
        { status: 400 }
      );
    }

    try {
      await appendLeadReplyAndNextSend(admin, {
        leadId: lead.id,
        projectId: project.id,
        leadReply,
        nextFollowup,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save sequence";
      return NextResponse.json(
        {
          error: msg.includes("client_followup_steps")
            ? "Run migration 038_client_followup_sequence.sql in Supabase first."
            : msg,
        },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await admin
      .from("leads")
      .update({
        client_followup_message: nextFollowup,
        client_followup_at: now,
        updated_at: now,
      })
      .eq("id", lead.id)
      .select("id, client_followup_message, client_followup_at")
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: error?.message || "Could not update follow-up" }, { status: 400 });
    }

    saved.push({
      id: updated.id,
      client_followup_message: updated.client_followup_message,
      client_followup_at: updated.client_followup_at,
    });
    names.push(lead.name);

    await notifyTeamClientFollowup({
      projectId: project.id,
      projectName: project.name,
      clientName: client.company_name || client.name,
      leadName: lead.name,
      message: nextFollowup,
      leadReply,
      isUpdate: true,
      isSequence: true,
    });
  }

  return NextResponse.json({ success: true, saved, names });
}
