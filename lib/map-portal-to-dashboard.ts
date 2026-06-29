import { formatDate, formatRelative } from "@/lib/utils";

export type ClientDashboardLiveData = {
  projectName: string;
  clientLabel: string;
  status: string;
  audienceBrief: string | null;
  targetTitles: string | null;
  stats: {
    total: number;
    interested: number;
    replied: number;
    replyRate: number;
  };
  responses: {
    id: string;
    name: string;
    title: string;
    preview: string;
    time: string;
    status: string;
    unread: boolean;
  }[];
  pipeline: { label: string; count: number; value: number }[];
  velocity: number[];
  latestActivity: { name: string; action: string; time: string } | null;
};

type PortalResponse = {
  id: string;
  name: string;
  company: string | null;
  position: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

type PortalPayload = {
  project: {
    name: string;
    status: string;
    audience_brief: string | null;
    target_titles: string | null;
    clients: { name: string; company_name: string | null } | { name: string; company_name: string | null }[] | null;
  };
  stats: { total: number; interested: number };
  responses: PortalResponse[];
};

function clientLabel(clients: PortalPayload["project"]["clients"]) {
  if (!clients) return "Client";
  const c = Array.isArray(clients) ? clients[0] : clients;
  return c?.company_name || c?.name || "Client";
}

function bucketVelocity(responses: PortalResponse[]): number[] {
  const days = 7;
  const counts = Array(days).fill(0);
  const now = new Date();
  for (const r of responses) {
    const d = new Date(r.created_at);
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff >= 0 && diff < days) {
      counts[days - 1 - diff] += 1;
    }
  }
  const max = Math.max(1, ...counts);
  return counts.map((c) => Math.round((c / max) * 100));
}

export function mapPortalToDashboard(data: PortalPayload): ClientDashboardLiveData {
  const responses = data.responses || [];
  const interested = responses.filter((r) => r.status === "interested").length;
  const replied = responses.filter((r) => r.status === "replied").length;
  const hot = interested + replied;
  const total = data.stats.total || responses.length;
  const replyRate = total > 0 ? Math.round((hot / total) * 1000) / 10 : 0;

  const pipeline = [
    { label: "Logged", count: total, value: 100 },
    {
      label: "Replied",
      count: replied,
      value: total ? Math.round((replied / total) * 100) : 0,
    },
    {
      label: "Hot",
      count: hot,
      value: total ? Math.round((hot / total) * 100) : 0,
    },
    {
      label: "Interested",
      count: interested,
      value: total ? Math.round((interested / total) * 100) : 0,
    },
  ];

  const mappedResponses = responses.map((r, i) => ({
    id: r.id,
    name: r.name,
    title: [r.position, r.company].filter(Boolean).join(" · ") || r.company || "LinkedIn lead",
    preview: r.notes || "—",
    time: formatDate(r.created_at),
    status: r.status.replace("_", " "),
    unread: i < 3 && ["interested", "replied"].includes(r.status),
  }));

  const latest = responses[0];

  return {
    projectName: data.project.name,
    clientLabel: clientLabel(data.project.clients),
    status: data.project.status,
    audienceBrief: data.project.audience_brief,
    targetTitles: data.project.target_titles,
    stats: { total, interested: hot, replied, replyRate },
    responses: mappedResponses,
    pipeline,
    velocity: bucketVelocity(responses),
    latestActivity: latest
      ? {
          name: latest.name,
          action: latest.notes?.slice(0, 60) || `Status: ${latest.status}`,
          time: formatRelative(latest.created_at),
        }
      : null,
  };
}
