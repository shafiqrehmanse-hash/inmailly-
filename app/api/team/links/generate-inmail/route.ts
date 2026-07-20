import { NextRequest, NextResponse } from "next/server";
import { getIntelligenceServicesPitch } from "@/lib/intelligence-pitch";
import { canUseOutreachTools } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentMember } from "@/lib/team";

const MAX_IMAGE_CHARS = 6_500_000; // ~4.5MB base64

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member?.is_active || !canUseOutreachTools(member.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server. Add it to Vercel env." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const linkId = String(body.linkId || "").trim();
  const imageDataUrl = String(body.imageDataUrl || "").trim();

  if (!linkId) return NextResponse.json({ error: "linkId required" }, { status: 400 });
  if (!imageDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Paste a screenshot image (Print Screen → Ctrl+V)" }, { status: 400 });
  }
  if (imageDataUrl.length > MAX_IMAGE_CHARS) {
    return NextResponse.json({ error: "Screenshot too large — crop or compress and try again" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("outreach_links")
    .select("*")
    .eq("id", linkId)
    .eq("member_id", member.id)
    .eq("status", "claimed")
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: "Link not found in your active queue" }, { status: 404 });
  }

  const firstName = (link.first_name || "").trim() || "there";
  const lastName = (link.last_name || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const pitch = getIntelligenceServicesPitch();

  const systemPrompt = `You are an elite B2B LinkedIn InMail copywriter for InMailly outreach SDRs.
Write ONE highly personalized LinkedIn InMail (subject + body) that maximizes reply chances.

Rules:
- Use the LinkedIn profile SCREENSHOT as the primary source of truth (headline, company, role, about, recent activity).
- Also use the known name: ${fullName}.
- Personalize specifically to what you see on the profile — never generic spam.
- Subject: short, curiosity-driven, not salesy (max ~60 chars). No emojis unless natural.
- Body: 80–140 words. Warm, professional, human. One clear soft CTA (reply or quick call).
- Do NOT invent credentials you cannot see. If screenshot is unclear, lean on name + visible headline only.
- Pitch our offering naturally in 1–2 sentences max — never a hard sell dump.
- Output STRICT JSON only: {"subject":"...","body":"..."}
- Body should use \\n for line breaks between paragraphs.`;

  const userText = `Prospect name: ${fullName}
Profile URL: ${link.url}

Our services (weave in lightly):
${pitch}

Write the personalized InMail JSON now based on the screenshot.`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
          ],
        },
      ],
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    console.error("OpenAI generate-inmail:", openaiRes.status, errText.slice(0, 400));
    return NextResponse.json(
      { error: "AI could not read this screenshot. Try a clearer Print Screen of the profile." },
      { status: 502 }
    );
  }

  const openaiJson = await openaiRes.json();
  const raw = openaiJson.choices?.[0]?.message?.content || "";
  let subject = "";
  let messageBody = "";
  try {
    const parsed = JSON.parse(raw);
    subject = String(parsed.subject || "").trim();
    messageBody = String(parsed.body || "").trim();
  } catch {
    return NextResponse.json({ error: "AI returned an invalid message — try again" }, { status: 502 });
  }

  if (!subject || !messageBody) {
    return NextResponse.json({ error: "AI returned an empty message — try again" }, { status: 502 });
  }

  const now = new Date().toISOString();
  await admin
    .from("outreach_links")
    .update({
      generated_subject: subject,
      generated_body: messageBody,
      generated_at: now,
      outreach_mode: "intelligence",
      updated_at: now,
    })
    .eq("id", linkId)
    .eq("member_id", member.id);

  return NextResponse.json({
    subject,
    body: messageBody,
    prospectName: fullName,
  });
}
