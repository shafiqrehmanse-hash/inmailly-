import { NextRequest, NextResponse } from "next/server";
import {
  generateReplyFromScreenshot,
  getReplyAssistantMeetingLink,
} from "@/lib/reply-assistant";
import { getOpenAiApiKey, validateScreenshotDataUrl } from "@/lib/openai-vision";
import { getOutreachEligibleMember } from "@/lib/team-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!getOpenAiApiKey()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server. Add it to Vercel env." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const leadId = String(body.leadId || "").trim();
  const imageDataUrl = String(body.imageDataUrl || "").trim();
  const includeMeetingLink = Boolean(body.includeMeetingLink);

  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });
  const imageError = validateScreenshotDataUrl(imageDataUrl);
  if (imageError) return NextResponse.json({ error: imageError }, { status: 400 });

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("member_id", member.id)
    .is("project_id", null)
    .maybeSingle();

  if (!lead) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const { data: messages } = await admin
    .from("lead_messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  const meetingLink = await getReplyAssistantMeetingLink(admin);

  try {
    const result = await generateReplyFromScreenshot({
      imageDataUrl,
      lead,
      messages: messages || [],
      includeMeetingLink,
      meetingLink,
    });

    return NextResponse.json({
      ...result,
      meetingLink: includeMeetingLink ? meetingLink : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate reply";
    const status = message.includes("OPENAI") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
