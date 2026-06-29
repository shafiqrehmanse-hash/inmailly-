export const SCRIPT_LIMITS = {
  add_note: 350,
  inmail: 1900,
  followup: 2000,
} as const;

export type ScriptKey =
  | "add_note"
  | "inmail"
  | "followup_accepted"
  | "followup_learn_more"
  | "followup_pricing";

export type ScriptPayload = {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
  badge: string;
  limit: number;
  content: string;
  subject: string;
  body: string;
  has_subject: boolean;
  length: number;
  remaining: number;
  pct: number;
  empty: boolean;
  tone: "note" | "inmail" | "followup";
};

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://inmailly.vercel.app";

export function parseScriptParts(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { subject: "", body: "", has_subject: false };
  }
  const match = trimmed.match(/^Subject\s*[:-]\s*([\s\S]+?)(?:\r?\n\r?\n|\r?\n|$)/i);
  if (match) {
    const subject = match[1].trim();
    const body = trimmed.slice(match[0].length).trim();
    return { subject, body, has_subject: subject.length > 0 };
  }
  return { subject: "", body: trimmed, has_subject: false };
}

function buildEntry(
  key: string,
  meta: {
    label: string;
    subtitle: string;
    icon: string;
    badge: string;
    limit: number;
    tone: ScriptPayload["tone"];
  },
  content: string
): ScriptPayload {
  const parts = parseScriptParts(content);
  const length = content.length;
  const limit = meta.limit;
  return {
    key,
    label: meta.label,
    subtitle: meta.subtitle,
    icon: meta.icon,
    badge: meta.badge,
    limit,
    content,
    subject: parts.subject,
    body: parts.body,
    has_subject: parts.has_subject,
    length,
    remaining: Math.max(0, limit - length),
    pct: limit > 0 ? Math.min(100, Math.round((length / limit) * 100)) : 0,
    empty: content.trim() === "",
    tone: meta.tone,
  };
}

export function followupScripts(): Record<string, ScriptPayload> {
  const items: Array<{ key: ScriptKey; content: string }> = [
    {
      key: "followup_accepted",
      content: `We help companies scale LinkedIn outreach in 3 ways:\n✅ Buy verification-badged LinkedIn profiles\n✅ Fully managed LinkedIn outreach campaigns\n✅ Send 1,000–5,000 targeted InMails without buying profiles or software\n\nWhich of these would be most relevant for you?\n\n${APP}`,
    },
    {
      key: "followup_learn_more",
      content: `Glad it resonated! A couple of quick questions so I can point you in the right direction:\n\n1. Are you looking to run outreach yourself, or would you prefer we handle it for you?\n2. What's your rough monthly outreach volume right now?\n\nBased on that I can share exactly what would work best for your situation.\n\nOr if you'd rather jump on a quick call — here's calendar: https://calendly.com/shafiqrehman-se/new-meeting`,
    },
    {
      key: "followup_pricing",
      content: `Sure! Here's our full pricing breakdown:\n👉 ${APP}/#pricing\n\nIf you'd like me to walk you through which plan fits your use case, feel free to grab a quick 15-min call:\n📅 https://calendly.com/shafiqrehman-se/new-meeting\n\nHappy to help you find the best option!`,
    },
  ];

  const labels: Record<
    ScriptKey,
    { label: string; subtitle: string; icon: string }
  > = {
    followup_accepted: {
      label: "After connection accepted",
      subtitle: "Send once they accept your request",
      icon: "🤝",
    },
    followup_learn_more: {
      label: 'After "I would like to learn more"',
      subtitle: "When they show interest in learning more",
      icon: "💬",
    },
    followup_pricing: {
      label: "After someone asks pricing",
      subtitle: "When they ask about cost or plans",
      icon: "💰",
    },
    add_note: { label: "", subtitle: "", icon: "" },
    inmail: { label: "", subtitle: "", icon: "" },
  };

  const out: Record<string, ScriptPayload> = {};
  for (const item of items) {
    const meta = labels[item.key];
    out[item.key] = buildEntry(item.key, {
      ...meta,
      badge: "Follow-up script",
      limit: SCRIPT_LIMITS.followup,
      tone: "followup",
    }, item.content);
  }
  return out;
}

export function buildScriptsPayload(db: {
  add_note?: string;
  inmail?: string;
}): Record<string, ScriptPayload> {
  const addNote = db.add_note?.trim() || "";
  const inmail = db.inmail?.trim() || "";

  const core: Record<string, ScriptPayload> = {
    add_note: buildEntry(
      "add_note",
      {
        label: "Add Note",
        subtitle: "LinkedIn connection note",
        icon: "📝",
        badge: `Max ${SCRIPT_LIMITS.add_note} chars`,
        limit: SCRIPT_LIMITS.add_note,
        tone: "note",
      },
      addNote
    ),
    inmail: buildEntry(
      "inmail",
      {
        label: "InMail",
        subtitle: "Sales Navigator direct message",
        icon: "📨",
        badge: `Up to ${SCRIPT_LIMITS.inmail.toLocaleString()} chars`,
        limit: SCRIPT_LIMITS.inmail,
        tone: "inmail",
      },
      inmail
    ),
  };

  return { ...core, ...followupScripts() };
}
