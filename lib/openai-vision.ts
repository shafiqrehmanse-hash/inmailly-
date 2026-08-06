/** Shared OpenAI vision + JSON completion — used by Intelligence InMail and Reply Assistant. */

export const OPENAI_VISION_MAX_IMAGE_CHARS = 6_500_000;

export function getOpenAiApiKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

export function getOpenAiVisionModel(): string {
  return process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
}

export function assertOpenAiConfigured(): string {
  const key = getOpenAiApiKey();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured on the server. Add it to Vercel env.");
  }
  return key;
}

export function validateScreenshotDataUrl(imageDataUrl: string): string | null {
  if (!imageDataUrl.startsWith("data:image/")) {
    return "Paste a screenshot image (Print Screen → Ctrl+V)";
  }
  if (imageDataUrl.length > OPENAI_VISION_MAX_IMAGE_CHARS) {
    return "Screenshot too large — crop or compress and try again";
  }
  return null;
}

type VisionJsonInput = {
  systemPrompt: string;
  userText: string;
  imageDataUrl: string;
  temperature?: number;
  maxTokens?: number;
  logLabel?: string;
  userFacingError?: string;
};

/** Vision chat completion that returns parsed JSON from the model response. */
export async function completeOpenAiVisionJson<T extends Record<string, unknown>>(
  input: VisionJsonInput
): Promise<T> {
  const apiKey = assertOpenAiConfigured();
  const label = input.logLabel || "openai-vision";

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiVisionModel(),
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: input.userText },
            { type: "image_url", image_url: { url: input.imageDataUrl, detail: "high" } },
          ],
        },
      ],
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    console.error(`OpenAI ${label}:`, openaiRes.status, errText.slice(0, 400));
    throw new Error(
      input.userFacingError ||
        "AI could not read this screenshot. Try a clearer Print Screen capture."
    );
  }

  const openaiJson = await openaiRes.json();
  const raw = openaiJson.choices?.[0]?.message?.content || "";

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("AI returned an invalid message — try again.");
  }
}
