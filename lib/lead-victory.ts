import { dealClosedCelebrationMessage } from "@/lib/deal-celebration";
import { notifyTeamDealClosed, notifyTeamMeetingBooked } from "@/lib/email";
import { meetingBookedCelebrationMessage } from "@/lib/meeting-celebration";
import { publishVictoryAnnouncement } from "@/lib/team-victory";

export type LeadVictoryCelebration = {
  kind: "deal_closed" | "meeting_booked";
  title: string;
  subtitle: string;
  message: string;
  leadName: string;
};

export async function processLeadVictories(opts: {
  existing: { deal_closed: boolean; status: string; name: string };
  data: { name: string; status: string; deal_closed?: boolean };
  member: { id: string; name: string; email: string };
  updates: { deal_closed?: boolean; status?: string };
}): Promise<LeadVictoryCelebration | null> {
  const { existing, data, member, updates } = opts;
  const leadName = data.name || existing.name;

  const newlyClosed = updates.deal_closed === true && !existing.deal_closed;
  if (newlyClosed) {
    const celebration = dealClosedCelebrationMessage(leadName, member.name);
    void publishVictoryAnnouncement({
      kind: "deal_closed",
      memberId: member.id,
      memberName: member.name,
      leadName,
    });
    if (member.email) {
      void notifyTeamDealClosed({
        email: member.email,
        memberName: member.name,
        leadName,
        message: celebration.message,
      });
    }
    return celebration;
  }

  const newlyMeeting =
    data.status === "meeting_booked" &&
    existing.status !== "meeting_booked" &&
    !data.deal_closed;

  if (newlyMeeting) {
    const celebration = meetingBookedCelebrationMessage(leadName, member.name);
    void publishVictoryAnnouncement({
      kind: "meeting_booked",
      memberId: member.id,
      memberName: member.name,
      leadName,
    });
    if (member.email) {
      void notifyTeamMeetingBooked({
        email: member.email,
        memberName: member.name,
        leadName,
        message: celebration.message,
      });
    }
    return celebration;
  }

  return null;
}
