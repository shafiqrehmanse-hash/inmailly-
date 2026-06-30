import type { Lead } from "@/lib/types";

/** Statuses that always appear on the team Responses page. */
export const TEAM_RESPONSE_STATUSES: Lead["status"][] = [
  "replied",
  "interested",
  "follow_up",
];

const PROMOTE_TO_REPLIED_FROM: Lead["status"][] = ["new", "contacted", "follow_up"];

export function shouldPromoteLeadToReplied(status: Lead["status"]) {
  return PROMOTE_TO_REPLIED_FROM.includes(status);
}

export function isTeamResponseLead(
  lead: Pick<Lead, "status">,
  hasInboundLeadMessage: boolean
) {
  if (TEAM_RESPONSE_STATUSES.includes(lead.status)) return true;
  return hasInboundLeadMessage && !["closed", "dead", "not_interested"].includes(lead.status);
}
