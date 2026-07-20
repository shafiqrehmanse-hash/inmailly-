/**
 * Default services pitch used by Intelligence InMail generation.
 * Override anytime with env INTELLIGENCE_SERVICES_PITCH (plain text).
 * Replace this copy with your full client-facing paragraph when ready.
 */
export const DEFAULT_INTELLIGENCE_SERVICES_PITCH = `InMailly is premium managed LinkedIn outreach infrastructure for B2B teams and agencies.

We help companies reach decision-makers on LinkedIn without paying enterprise InMail pricing. Our human-operated team runs personalized outreach at scale using Sales Navigator targeting, proven InMail scripts, transparent send proofs, and live response tracking in a client dashboard.

What we deliver:
- Managed LinkedIn / Sales Navigator outreach campaigns
- Personalized InMail and connection messaging that sounds human, not spam
- Transparent campaign reporting (sends, responses, interested leads)
- White-label dashboards for agencies who want to resell outreach under their brand
- Faster pipeline of meetings and replies without hiring an in-house SDR team

Positioning for outreach: we are not a cheap automation tool. We are a premium outreach partner that helps founders, sales leaders, and agencies book more conversations with the right people on LinkedIn.`;

export function getIntelligenceServicesPitch(): string {
  const fromEnv = process.env.INTELLIGENCE_SERVICES_PITCH?.trim();
  return fromEnv || DEFAULT_INTELLIGENCE_SERVICES_PITCH;
}
