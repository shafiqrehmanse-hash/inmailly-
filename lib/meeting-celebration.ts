const MEETING_MESSAGES = [
  "Meeting booked — you’re turning outreach into real conversations. The team sees this win on the banner. Keep pushing.",
  "Calendar locked in. That’s a major milestone between first reply and closed deal. Outstanding hustle.",
  "Another meeting on the board. You’re proving the pipeline works — the whole team is watching and inspired.",
  "Meeting secured. This is exactly how top performers move leads forward. One step closer to the trophy.",
  "Big win — meeting booked. Your name is on the team banner for 24 hours. Go get the next one.",
];

export function meetingBookedCelebrationMessage(leadName: string, memberFirstName?: string | null) {
  const first = (memberFirstName || "Champion").trim().split(/\s+/)[0] || "Champion";
  const body = MEETING_MESSAGES[Math.floor(Math.random() * MEETING_MESSAGES.length)];
  return {
    kind: "meeting_booked" as const,
    title: `📅 Meeting booked, ${first}!`,
    subtitle: `${leadName} is on the calendar`,
    message: body,
    leadName,
  };
}
