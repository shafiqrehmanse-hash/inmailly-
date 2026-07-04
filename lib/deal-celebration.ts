const TROPHY_MESSAGES = [
  "You just closed a deal — that’s champion energy. The whole team sees this win on the leaderboard. Keep stacking trophies.",
  "Deal closed. Trophy unlocked. You turned outreach into revenue — this is exactly how legends climb the board.",
  "Boom — deal closed! That win counts on Team Performance. You’re proving what’s possible. Go get the next one.",
  "Winner’s circle. You closed the deal and earned the trophy. Your score just jumped — the team is watching and inspired.",
  "Closed deal. Full trophy moment. This is the payoff for every link, every lead, every follow-up. Outstanding work.",
];

export function dealClosedCelebrationMessage(leadName: string, memberFirstName?: string | null) {
  const first = (memberFirstName || "Champion").trim().split(/\s+/)[0] || "Champion";
  const body = TROPHY_MESSAGES[Math.floor(Math.random() * TROPHY_MESSAGES.length)];
  return {
    kind: "deal_closed" as const,
    title: `🏆 Deal closed, ${first}!`,
    subtitle: `${leadName} is a win`,
    message: body,
    leadName,
  };
}
