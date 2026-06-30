export const FOUNDER_NAME = "Shafiq Rehman";
export const BRAND_NAME = "InMailly";

export function teamBroadcastSignature() {
  return `

--
Warm regards,

Shafiq Rehman
Founder, InMailly
Shafiq's Marketing Automations Valley

You're on the InMailly outreach team — built for ambitious closers.
Reply anytime. I'm in your corner.`;
}

export function teamBroadcastPlainBody(memberName: string, message: string) {
  const first = memberName.trim().split(/\s+/)[0] || memberName;
  return `Hey ${first},\n\n${message.trim()}${teamBroadcastSignature()}`;
}

export function teamBroadcastHtmlBody(memberName: string, message: string) {
  const plain = teamBroadcastPlainBody(memberName, message);
  const escaped = plain
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#111">${escaped}</div>`;
}
