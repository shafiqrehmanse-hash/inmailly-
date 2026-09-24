import type { createAdminClient } from "@/lib/supabase/admin";
import { countProjectCampaignStats, type ProjectCampaignCounts } from "@/lib/project-campaign-stats";
import { listCampaignProfilesForProject } from "@/lib/client-campaign-profiles";

type AdminClient = ReturnType<typeof createAdminClient>;

export type CaseStudyImage = {
  bytes: Uint8Array;
  kind: "jpg" | "png";
};

export type ProjectCaseStudy = {
  projectId: string;
  companyName: string;
  contactName: string;
  projectName: string;
  status: string;
  generatedAt: string;
  audienceBrief: string | null;
  targetTitles: string | null;
  targetIndustries: string | null;
  targetRegions: string | null;
  inmailSubject: string | null;
  packageSize: number | null;
  stats: ProjectCampaignCounts;
  replyRate: number;
  packagePercent: number;
  logo: CaseStudyImage | null;
  proofs: CaseStudyImage[];
  proofTotal: number;
  profiles: { name: string; title: string | null; headline: string | null }[];
  sampleLeads: { name: string; company: string | null; position: string | null; status: string }[];
  pageShots: { label: string; caption: string; image: CaseStudyImage }[];
};

function imageKind(bytes: Uint8Array, mime?: string | null): "jpg" | "png" | null {
  const m = (mime || "").toLowerCase();
  if (m.includes("png") || (bytes[0] === 0x89 && bytes[1] === 0x50)) return "png";
  if (m.includes("jpeg") || m.includes("jpg") || (bytes[0] === 0xff && bytes[1] === 0xd8)) return "jpg";
  return null;
}

async function bytesFromBlob(blob: Blob): Promise<CaseStudyImage | null> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  if (buf.byteLength < 32) return null;
  const kind = imageKind(buf, blob.type);
  if (!kind) return null;
  return { bytes: buf, kind };
}

async function fetchLogo(url: string | null | undefined): Promise<CaseStudyImage | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const blob = await res.blob();
    return bytesFromBlob(blob);
  } catch {
    return null;
  }
}

export function caseStudyFilename(companyName: string) {
  const slug =
    companyName
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "Project";
  return `InMailly-Case-Study-${slug}.pdf`;
}

export async function assembleProjectCaseStudy(
  admin: AdminClient,
  projectId: string
): Promise<ProjectCaseStudy | null> {
  const { data: project } = await admin
    .from("projects")
    .select(
      `
      id, name, status, audience_brief, target_titles, target_industries, target_regions,
      inmail_package_size, inmail_subject,
      clients ( name, company_name, logo_url )
    `
    )
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return null;

  const clientRaw = project.clients as
    | { name: string; company_name: string | null; logo_url: string | null }
    | { name: string; company_name: string | null; logo_url: string | null }[]
    | null;
  const client = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw;
  const companyName = client?.company_name || client?.name || "Client";
  const contactName = client?.name || companyName;

  const [stats, proofRowsRes, leadsRes, profiles, logo] = await Promise.all([
    countProjectCampaignStats(admin, projectId),
    admin
      .from("send_proofs")
      .select("id, display_path, created_at")
      .eq("project_id", projectId)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false })
      .limit(12),
    admin
      .from("leads")
      .select("name, company, position, status")
      .eq("project_id", projectId)
      .eq("visible_to_client", true)
      .in("status", ["interested", "replied"])
      .order("created_at", { ascending: false })
      .limit(8),
    listCampaignProfilesForProject(admin, projectId, { clientVisibleOnly: true }).catch(() => []),
    fetchLogo(client?.logo_url),
  ]);

  const proofRows = proofRowsRes.data || [];
  const proofs: CaseStudyImage[] = [];
  for (const row of proofRows) {
    if (!row.display_path) continue;
    const { data } = await admin.storage.from("proof-screenshots").download(row.display_path);
    if (!data) continue;
    const img = await bytesFromBlob(data);
    if (img) proofs.push(img);
  }

  const sends = stats.sends;
  const replyRate = sends > 0 ? Math.round((stats.interested / sends) * 1000) / 10 : 0;
  const packageSize = project.inmail_package_size as number | null;
  const packagePercent =
    packageSize && packageSize > 0 ? Math.min(100, (sends / packageSize) * 100) : 0;

  const study: ProjectCaseStudy = {
    projectId,
    companyName,
    contactName,
    projectName: project.name,
    status: project.status,
    generatedAt: new Date().toISOString(),
    audienceBrief: project.audience_brief,
    targetTitles: project.target_titles,
    targetIndustries: project.target_industries,
    targetRegions: project.target_regions,
    inmailSubject: project.inmail_subject,
    packageSize,
    stats,
    replyRate,
    packagePercent,
    logo,
    proofs,
    proofTotal: stats.sends,
    profiles: (profiles || []).slice(0, 6).map((p) => ({
      name: p.display_name,
      title: p.title,
      headline: p.headline,
    })),
    sampleLeads: (leadsRes.data || []).map((l) => ({
      name: l.name,
      company: l.company,
      position: l.position,
      status: l.status,
    })),
    pageShots: [],
  };

  return study;
}
