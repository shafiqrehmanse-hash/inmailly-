import { formatDate, formatRelative } from "@/lib/utils";

export type ClientDashboardLiveData = {
  projectName: string;
  clientLabel: string;
  status: string;
  audienceBrief: string | null;
  targetTitles: string | null;
  stats: {
    total: number;
    teamResponses?: number;
    interested: number;
    replied: number;
    replyRate: number;
    sends: number;
    teamSends?: number;
  };
  responses: {
    id: string;
    name: string;
    title: string;
    preview: string;
    time: string;
    status: string;
    unread: boolean;
    profileUrl: string | null;
    clientFollowupMessage: string | null;
    clientFollowupAt: string | null;
  }[];
  pipeline: { label: string; count: number; value: number }[];
  velocity: number[];
  latestActivity: { name: string; action: string; time: string } | null;
  proofs: { id: string; image_url: string; time: string }[];
  packageProgress: { target: number; completed: number; percent: number } | null;
};

type PortalResponse = {
  id: string;
  name: string;
  company: string | null;
  position: string | null;
  profile_url: string | null;
  status: string;
  notes: string | null;
  client_followup_message: string | null;
  client_followup_at: string | null;
  created_at: string;
};

type PortalProof = {
  id: string;
  image_url: string | null;
  created_at: string;
};

type PortalPayload = {
  project: {
    name: string;
    status: string;
    audience_brief: string | null;
    target_titles: string | null;
    inmail_package_size?: number | null;
    clients: { name: string; company_name: string | null } | { name: string; company_name: string | null }[] | null;
  };
  stats: { total: number; interested: number; sends?: number; teamResponses?: number; teamSends?: number };
  responses: PortalResponse[];
  proofs?: PortalProof[];
};

function clientLabel(clients: PortalPayload["project"]["clients"]) {
  if (!clients) return "Client";
  const c = Array.isArray(clients) ? clients[0] : clients;
  return c?.company_name || c?.name || "Client";
}

function buildPackageProgress(
  packageSize: number | null | undefined,
  completed: number
): ClientDashboardLiveData["packageProgress"] {
  if (!packageSize || packageSize <= 0) return null;
  const safeCompleted = Math.min(completed, packageSize);
  return {
    target: packageSize,
    completed: safeCompleted,
    percent: Math.min(100, (safeCompleted / packageSize) * 100),
  };
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
  const responseTotal = data.stats.total || responses.length;
  const proofList = (data.proofs || []).filter((p) => p.image_url);
  const inmailsSent = data.stats.sends ?? proofList.length;
  const teamInmails = data.stats.teamSends ?? inmailsSent;
  const replyRate =
    inmailsSent > 0 ? Math.round((hot / inmailsSent) * 1000) / 10 : responseTotal > 0 ? 100 : 0;

  const pipeline = [
    { label: "InMails", count: inmailsSent, value: 100 },
    {
      label: "Replied",
      count: replied,
      value: inmailsSent ? Math.round((replied / inmailsSent) * 100) : 0,
    },
    {
      label: "Hot",
      count: hot,
      value: inmailsSent ? Math.round((hot / inmailsSent) * 100) : 0,
    },
    {
      label: "Responses",
      count: responseTotal,
      value: inmailsSent ? Math.round((responseTotal / inmailsSent) * 100) : 0,
    },
  ];

  const mappedResponses = responses.map((r, i) => ({
    id: r.id,
    name: r.name,
    title: [r.position, r.company].filter(Boolean).join(" · ") || r.company || "LinkedIn lead",
    preview: r.notes || "—",
    time: formatDate(r.created_at),
    status: (r.status || "replied").replace("_", " "),
    unread: i < 3 && ["interested", "replied"].includes(r.status),
    profileUrl: r.profile_url?.trim() || null,
    clientFollowupMessage: r.client_followup_message?.trim() || null,
    clientFollowupAt: r.client_followup_at || null,
  }));

  const latest = responses[0];

  return {
    projectName: data.project.name,
    clientLabel: clientLabel(data.project.clients),
    status: data.project.status,
    audienceBrief: data.project.audience_brief,
    targetTitles: data.project.target_titles,
    stats: {
      total: responseTotal,
      teamResponses: data.stats.teamResponses ?? responseTotal,
      interested: hot,
      replied,
      replyRate,
      sends: inmailsSent,
      teamSends: teamInmails,
    },
    responses: mappedResponses,
    pipeline,
    velocity: bucketVelocity(responses),
    latestActivity: latest
      ? {
          name: latest.name,
          action: latest.notes?.slice(0, 60) || `Status: ${latest.status}`,
          time: formatRelative(latest.created_at),
        }
      : proofList[0]
        ? {
            name: "InMail sent",
            action: "Verified send proof uploaded",
            time: formatRelative(proofList[0].created_at),
          }
        : null,
    proofs: proofList.map((p) => ({
      id: p.id,
      image_url: p.image_url!,
      time: formatDate(p.created_at),
    })),
    packageProgress: buildPackageProgress(data.project.inmail_package_size, inmailsSent),
  };
}
