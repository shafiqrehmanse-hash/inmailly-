import {
  FOUNDER_BROADCAST_SIGNATURE,
  leaderBroadcastSignature,
  teamBroadcastEmail,
  teamBroadcastPlainText,
  type BroadcastSignature,
} from "@/lib/email-templates";

export const FOUNDER_NAME = FOUNDER_BROADCAST_SIGNATURE.name;
export const BRAND_NAME = "InMailly";

export { FOUNDER_BROADCAST_SIGNATURE, leaderBroadcastSignature };

export function teamBroadcastSignature() {
  return `

--
Warm regards,

${FOUNDER_BROADCAST_SIGNATURE.name}
${FOUNDER_BROADCAST_SIGNATURE.title}
${FOUNDER_BROADCAST_SIGNATURE.tagline || ""}

Reply anytime. I'm in your corner.`;
}

export function teamBroadcastPlainBody(
  memberName: string,
  message: string,
  subject: string,
  signature = FOUNDER_BROADCAST_SIGNATURE
) {
  const first = memberName.trim().split(/\s+/)[0] || memberName;
  return teamBroadcastPlainText({
    recipientFirstName: first,
    subject: subject.trim() || "Update from InMailly",
    message,
    signature,
  });
}

export function teamBroadcastHtmlBody(
  memberName: string,
  message: string,
  subject: string,
  signature: BroadcastSignature = FOUNDER_BROADCAST_SIGNATURE
) {
  const first = memberName.trim().split(/\s+/)[0] || memberName;
  return teamBroadcastEmail({
    recipientFirstName: first,
    subject: subject.trim() || "Update from InMailly",
    message,
    signature,
  });
}
