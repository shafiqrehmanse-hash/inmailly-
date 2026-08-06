/** Shared OpenAI vision + JSON completion — used by Intelligence InMail and Reply Assistant. */

export const OPENAI_VISION_MAX_IMAGE_CHARS = 6_500_000;

export function getOpenAiApiKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

export function getOpenAiVisionModel(): string {
  const model = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
  if (model.startsWith("sk-")) {
    throw new Error(
      "OPENAI_VISION_MODEL is set to an API key by mistake. In Vercel: put the sk-… key in OPENAI_API_KEY only, and set OPENAI_VISION_MODEL to gpt-4o-mini (or delete OPENAI_VISION_MODEL)."
    );
  }
  return model;
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

function openAiErrorMessage(status: number, errText: string): string {
  let detail = "";
  try {
    const parsed = JSON.parse(errText) as { error?: { message?: string; code?: string; type?: string } };
    detail = parsed.error?.message || "";
    const code = (parsed.error?.code || parsed.error?.type || "").toLowerCase();
    if (
      code.includes("insufficient_quota") ||
      detail.toLowerCase().includes("insufficient quota") ||
      detail.toLowerCase().includes("exceeded your current quota")
    ) {
      return "OpenAI credits exhausted — add billing or top up at platform.openai.com → Settings → Billing.";
    }
    if (code.includes("billing") || detail.toLowerCase().includes("billing")) {
      return "OpenAI billing issue — add a payment method at platform.openai.com → Settings → Billing.";
    }
    if (status === 401 || detail.toLowerCase().includes("incorrect api key")) {
      return "Invalid OPENAI_API_KEY — check the key in Vercel env and redeploy.";
    }
    if (status === 429) {
      return "OpenAI rate limit — wait a minute and try again, or check billing/credits.";
    }
    if (detail) return detail.slice(0, 220);
  } catch {
    /* use status fallback */
  }
  if (status === 401) return "Invalid OPENAI_API_KEY — check Vercel env and redeploy.";
  if (status === 429) return "OpenAI rate limit or no credits — check platform.openai.com billing.";
  if (status === 402) return "OpenAI payment required — add billing at platform.openai.com.";
  return "OpenAI request failed — check API key and billing, then redeploy on Vercel.";
}

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
    throw new Error(openAiErrorMessage(openaiRes.status, errText));
  }

  const openaiJson = await openaiRes.json();
  const raw = openaiJson.choices?.[0]?.message?.content || "";

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("AI returned an invalid message — try again.");
  }
}
