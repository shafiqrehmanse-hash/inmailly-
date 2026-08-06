import { getIntelligenceServicesPitch } from "@/lib/intelligence-pitch";
import { completeOpenAiVisionJson } from "@/lib/openai-vision";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Lead, LeadMessage } from "@/lib/types";

type AdminClient = ReturnType<typeof createAdminClient>;

export type ReplyAssistantGenerateResult = {
  reply: string;
  prospectMessage: string | null;
  suggestMeeting: boolean;
};

export async function getReplyAssistantMeetingLink(admin: AdminClient): Promise<string | null> {
  const fromEnv = process.env.REPLY_ASSISTANT_MEETING_LINK?.trim();
  if (fromEnv) return fromEnv;

  const { data } = await admin
    .from("settings")
    .select("value")
    .eq("key", "reply_assistant_meeting_link")
    .maybeSingle();

  const link = data?.value?.trim();
  return link || null;
}

export function formatThreadForPrompt(messages: LeadMessage[], lead: Pick<Lead, "name">): string {
  if (!messages.length) {
    return "(No messages saved yet — use the screenshot as the full context.)";
  }

  return messages
    .map((m) => {
      const who = m.sender === "lead" ? lead.name : "You (SDR)";
      return `[${who}] ${m.content}`;
    })
    .join("\n\n");
}

export async function generateReplyFromScreenshot(input: {
  imageDataUrl: string;
  lead: Pick<Lead, "name" | "company" | "position">;
  messages: LeadMessage[];
  includeMeetingLink: boolean;
  meetingLink: string | null;
}): Promise<ReplyAssistantGenerateResult> {
  const pitch = getIntelligenceServicesPitch();
  const thread = formatThreadForPrompt(input.messages, input.lead);
  const meetingNote = input.includeMeetingLink && input.meetingLink
    ? `\nInclude this booking link naturally in your reply: ${input.meetingLink}`
    : input.includeMeetingLink
      ? "\nInvite them to book a quick call — ask what time works (no link configured yet)."
      : "";

  const systemPrompt = `You are an expert LinkedIn outreach SDR assistant for InMailly.
Your job: read a LinkedIn messaging SCREENSHOT and draft the NEXT message the SDR should send.

Rules:
- Match the tone of the conversation — warm, professional, human, never spammy.
- Use the saved thread history plus what you see in the screenshot (screenshot is source of truth for latest messages).
- If the prospect sent a new message visible in the screenshot, extract it verbatim in prospect_message.
- Do NOT repeat a message already in the thread history.
- Keep replies concise: 2–5 short paragraphs max, suitable for LinkedIn DM/InMail.
- Pitch our services lightly only when it fits — never a hard sell on every reply.
- Move toward a discovery call when they show interest; set suggest_meeting true when appropriate.
- Output STRICT JSON only:
  {"reply":"...","prospect_message":"... or null if none new","suggest_meeting":false}

Our services (reference when relevant):
${pitch}${meetingNote}`;

  const userText = `Prospect: ${input.lead.name}${input.lead.company ? ` at ${input.lead.company}` : ""}${input.lead.position ? ` (${input.lead.position})` : ""}

Saved thread history:
${thread}

Read the screenshot. Draft the SDR's next reply JSON now.`;

  const parsed = await completeOpenAiVisionJson<{
    reply?: string;
    prospect_message?: string | null;
    suggest_meeting?: boolean;
  }>({
    systemPrompt,
    userText,
    imageDataUrl: input.imageDataUrl,
    temperature: 0.65,
    maxTokens: 900,
    logLabel: "reply-assistant",
    userFacingError:
      "AI could not read this screenshot. Try a clearer capture of the LinkedIn thread.",
  });

  const reply = String(parsed.reply || "").trim();
  if (!reply) throw new Error("AI returned an empty reply — try again.");

  const prospectRaw = parsed.prospect_message;
  const prospectMessage =
    prospectRaw && String(prospectRaw).trim() && String(prospectRaw).toLowerCase() !== "null"
      ? String(prospectRaw).trim()
      : null;

  return {
    reply,
    prospectMessage,
    suggestMeeting: Boolean(parsed.suggest_meeting),
  };
}

/** Skip saving duplicate prospect text already at end of thread. */
export function shouldSaveProspectMessage(messages: LeadMessage[], prospectMessage: string | null): boolean {
  if (!prospectMessage?.trim()) return false;
  const lastLead = [...messages].reverse().find((m) => m.sender === "lead");
  if (!lastLead) return true;
  return lastLead.content.trim().toLowerCase() !== prospectMessage.trim().toLowerCase();
}
