export const DEMO_CAMPAIGN = {
  name: "Q2 Enterprise Outreach",
  status: "live" as const,
  sent: 1847,
  opened: 1204,
  replied: 211,
  meetings: 34,
  replyRate: 11.4,
  costPerMsg: 0.27,
};

export const DEMO_ACTIVITY = [
  { id: "1", name: "Sarah Chen", role: "VP Growth", company: "Acme SaaS", action: "Replied to InMail", time: "2m ago", hot: true },
  { id: "2", name: "James Morrison", role: "Head of Sales", company: "NovaTech", action: "Requested pricing", time: "8m ago", hot: true },
  { id: "3", name: "Elena Vasquez", role: "Founder", company: "Stackline", action: "Accepted connection", time: "14m ago", hot: false },
  { id: "4", name: "Marcus Webb", role: "CRO", company: "Pulse AI", action: "Booked discovery call", time: "22m ago", hot: true },
];

export const DEMO_RESPONSES = [
  {
    id: "r1",
    name: "Sarah Chen",
    title: "VP Growth · Acme SaaS",
    preview: "This is exactly what we've been looking for. Can we jump on a call this week?",
    time: "Today, 9:14 AM",
    status: "interested",
    unread: true,
    profileUrl: "https://www.linkedin.com/in/example",
    clientFollowupMessage: null,
    clientFollowupAt: null,
  },
  {
    id: "r2",
    name: "James Morrison",
    title: "Head of Sales · NovaTech",
    preview: "Send me pricing for 5k sends. We're comparing a few vendors.",
    time: "Today, 8:42 AM",
    status: "hot",
    unread: true,
    profileUrl: "https://www.linkedin.com/in/example",
    clientFollowupMessage: null,
    clientFollowupAt: null,
  },
  {
    id: "r3",
    name: "Priya Nair",
    title: "Founder · Launchpad",
    preview: "Love the approach — human-operated is a big plus for us.",
    time: "Yesterday",
    status: "replied",
    unread: false,
    profileUrl: null,
    clientFollowupMessage: null,
    clientFollowupAt: null,
  },
];

export const PIPELINE_STAGES = [
  { label: "Sent", value: 92, count: 1847 },
  { label: "Opened", value: 65, count: 1204 },
  { label: "Replied", value: 28, count: 211 },
  { label: "Meeting", value: 12, count: 34 },
];
