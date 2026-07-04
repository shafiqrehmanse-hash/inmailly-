import { Resend } from "resend";
import {
  adminClientSignupEmail,
  adminClientVerifiedEmail,
  adminContactEmail,
  adminTeamSignupPendingEmail,
  adminTeamVerifiedEmail,
  clientCampaignStartedEmail,
  clientCampaignFinishedEmail,
  clientBrandingRequestEmail,
  adminBrandingSubmittedEmail,
  adminLeadNoteEmail,
  teamDealClosedEmail,
  clientCustomEmail,
  clientNewResponseEmail,
  clientSendProofEmail,
  clientVerifyEmail,
  clientWelcomeVerifiedEmail,
  teamClientFollowupEmail,
  teamVerifyEmail,
  teamWelcomeVerifiedEmail,
} from "@/lib/email-templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer | string }[];
};

let resendClient: Resend | null = null;

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

export function getEmailFrom() {
  return process.env.EMAIL_FROM || "InMailly <notifications@inmailly.com>";
}

export function getNotifyEmail() {
  return process.env.NOTIFY_EMAIL || "hello@inmailly.com";
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(input: SendEmailInput) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipped:", input.subject);
    return { ok: false as const, skipped: true };
  }

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content:
        typeof a.content === "string"
          ? a.content
          : Buffer.from(a.content).toString("base64"),
    })),
  });

  if (error) {
    console.error("[email] send failed:", error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, id: data?.id };
}

export async function sendEmailSafe(input: SendEmailInput) {
  try {
    return await sendEmail(input);
  } catch (e) {
    console.error("[email] unexpected error:", e);
    return { ok: false as const, error: "unexpected" };
  }
}

export async function notifyAdminContact(data: {
  name: string;
  email: string;
  company?: string | null;
  volume?: string | null;
  message?: string | null;
}) {
  return sendEmailSafe({
    to: getNotifyEmail(),
    replyTo: data.email,
    subject: `New contact: ${data.name}${data.company ? ` · ${data.company}` : ""}`,
    html: adminContactEmail(data),
    text: `New contact from ${data.name} (${data.email})`,
  });
}

export async function notifyAdminClientSignup(data: {
  name: string;
  email: string;
  company?: string | null;
}) {
  const result = await sendEmailSafe({
    to: getNotifyEmail(),
    replyTo: data.email,
    subject: `New client signup: ${data.name}`,
    html: adminClientSignupEmail(data),
    text: `New client signup: ${data.name} (${data.email})`,
  });
  if (!result.ok && !result.skipped) {
    console.error("[email] admin signup notify failed:", result.error);
  } else if (result.skipped) {
    console.warn("[email] admin signup notify skipped — RESEND_API_KEY not set");
  }
  return result;
}

export async function notifyAdminClientVerified(data: {
  name: string;
  email: string;
  company?: string | null;
}) {
  return sendEmailSafe({
    to: getNotifyEmail(),
    replyTo: data.email,
    subject: `Client verified email: ${data.name}`,
    html: adminClientVerifiedEmail(data),
    text: `Client verified: ${data.name} (${data.email})`,
  });
}

export async function notifyAdminTeamSignupPending(data: {
  name: string;
  email: string;
  phone?: string | null;
  inviteCode?: string | null;
}) {
  return sendEmailSafe({
    to: getNotifyEmail(),
    replyTo: data.email,
    subject: `New team signup (pending verify): ${data.name}`,
    html: adminTeamSignupPendingEmail(data),
    text: `New team signup pending verification: ${data.name} (${data.email})${data.phone ? ` · ${data.phone}` : ""}`,
  });
}

export async function notifyAdminTeamVerified(data: {
  name: string;
  email: string;
  phone?: string | null;
  inviteCode?: string | null;
}) {
  return sendEmailSafe({
    to: getNotifyEmail(),
    replyTo: data.email,
    subject: `Team member verified: ${data.name}`,
    html: adminTeamVerifiedEmail(data),
    text: `Team member verified: ${data.name} (${data.email})${data.phone ? ` · ${data.phone}` : ""}`,
  });
}

export async function sendTeamVerificationEmail(data: {
  name: string;
  email: string;
  verifyUrl: string;
}) {
  const first = data.name.trim().split(" ")[0];
  return sendEmailSafe({
    to: data.email,
    subject: "Verify your email — InMailly team workspace",
    html: teamVerifyEmail({ firstName: first, verifyUrl: data.verifyUrl }),
    text: `Hi ${first}, verify your email to join the InMailly team: ${data.verifyUrl}`,
  });
}

export async function notifyTeamWelcomeVerified(data: { name: string; email: string }) {
  const first = data.name.trim().split(" ")[0];
  const site = getSiteUrl();
  return sendEmailSafe({
    to: data.email,
    replyTo: getNotifyEmail(),
    subject: `Welcome to InMailly, ${first} — you're officially in ✦`,
    html: teamWelcomeVerifiedEmail({ firstName: first }),
    text: `Hey ${first},\n\nWelcome to the InMailly outreach team — your email is verified and your workspace is live.\n\nOpen your hub: ${site}/team/hub\nClaim links: ${site}/team/links\n\nWarm regards,\nShafiq Rehman\nFounder, InMailly\nShafiq's Marketing Automations Valley\n\nReply anytime — I'm in your corner.`,
  });
}

export async function sendClientVerificationEmail(data: {
  name: string;
  email: string;
  verifyUrl: string;
}) {
  const first = data.name.trim().split(" ")[0];
  return sendEmailSafe({
    to: data.email,
    subject: "Verify your email — InMailly dashboard",
    html: clientVerifyEmail({ firstName: first, verifyUrl: data.verifyUrl }),
    text: `Hi ${first}, verify your email to access your InMailly dashboard: ${data.verifyUrl}`,
  });
}

export async function notifyClientWelcomeVerified(data: {
  name: string;
  email: string;
  company?: string | null;
}) {
  const first = data.name.trim().split(" ")[0];
  const site = getSiteUrl();
  return sendEmailSafe({
    to: data.email,
    replyTo: getNotifyEmail(),
    subject: `Welcome to InMailly, ${first} — your dashboard is ready ◆`,
    html: clientWelcomeVerifiedEmail({ firstName: first, company: data.company }),
    text: `Hi ${first},\n\nWelcome to InMailly — your email is verified and your campaign dashboard is unlocked.\n\nOpen dashboard: ${site}/client/dashboard\nBook a call: ${site}/contact\n\nWarm regards,\nShafiq Rehman\nFounder, InMailly\nShafiq's Marketing Automations Valley\n\nReply anytime — we're here to help.`,
  });
}

export async function notifyClientCampaignLive(data: {
  email: string;
  clientName: string;
  projectName: string;
}) {
  return notifyClientCampaignStarted(data);
}

export async function notifyClientCampaignStarted(data: {
  email: string;
  clientName: string;
  projectName: string;
}) {
  return sendEmailSafe({
    to: data.email,
    replyTo: getNotifyEmail(),
    subject: `We've started your campaign: ${data.projectName}`,
    html: clientCampaignStartedEmail(data),
    text: `Hi ${data.clientName}, we've started your campaign "${data.projectName}".`,
  });
}

export async function notifyClientCampaignFinished(data: {
  email: string;
  clientName: string;
  projectName: string;
}) {
  return sendEmailSafe({
    to: data.email,
    replyTo: getNotifyEmail(),
    subject: `Campaign complete: ${data.projectName}`,
    html: clientCampaignFinishedEmail(data),
    text: `Hi ${data.clientName}, your campaign "${data.projectName}" has finished.`,
  });
}

export async function notifyClientCustom(data: {
  email: string;
  clientName: string;
  subject: string;
  message: string;
}) {
  return sendEmailSafe({
    to: data.email,
    replyTo: getNotifyEmail(),
    subject: data.subject,
    html: clientCustomEmail(data),
    text: data.message,
  });
}

export async function notifyClientBrandingRequest(data: {
  email: string;
  clientName: string;
  projectName: string;
  packageSize?: number | null;
}) {
  return sendEmailSafe({
    to: data.email,
    replyTo: getNotifyEmail(),
    subject: `Action required: Submit branding for ${data.projectName}`,
    html: clientBrandingRequestEmail(data),
    text: `Hi ${data.clientName}, please submit your InMail subject, script, Sales Nav link, and send count for "${data.projectName}" at ${getSiteUrl()}/client/branding`,
  });
}

export async function notifyAdminBrandingSubmitted(data: {
  clientName: string;
  companyName?: string | null;
  projectName: string;
  inmailSubject: string;
  salesNavLinkCount: number;
  profileLinksParsed?: number;
}) {
  const label = data.companyName || data.clientName;
  return sendEmailSafe({
    to: getNotifyEmail(),
    subject: `Branding submitted: ${label} — ${data.projectName}`,
    html: adminBrandingSubmittedEmail(data),
    text: `${label} submitted branding for ${data.projectName}. Subject: ${data.inmailSubject}`,
  });
}

export async function notifyAdminLeadNote(data: {
  leadName: string;
  note: string;
  memberName?: string | null;
  status?: string | null;
  profileUrl?: string | null;
  company?: string | null;
}) {
  const note = data.note.trim();
  if (!note) return { ok: false as const, skipped: true };

  return sendEmailSafe({
    to: getNotifyEmail(),
    subject: `Lead note: ${data.leadName}`,
    html: adminLeadNoteEmail({ ...data, note }),
    text: `Lead: ${data.leadName}\nAdded by: ${data.memberName || "Team"}\nStatus: ${data.status || "—"}\n\nNote / what they said:\n${note}`,
  });
}

export async function notifyTeamDealClosed(data: {
  email: string;
  memberName: string;
  leadName: string;
  message: string;
}) {
  const first = data.memberName.trim().split(/\s+/)[0] || "Champion";
  return sendEmailSafe({
    to: data.email,
    replyTo: getNotifyEmail(),
    subject: `🏆 Deal closed: ${data.leadName} — trophy unlocked`,
    html: teamDealClosedEmail(data),
    text: `Hi ${first},\n\n${data.message}\n\nLead: ${data.leadName}\nSee the leaderboard: ${getSiteUrl()}/team/performance`,
  });
}

export async function notifyClientNewResponse(data: {
  email: string;
  clientName: string;
  projectName: string;
  leadName: string;
  preview?: string | null;
}) {
  return sendEmailSafe({
    to: data.email,
    subject: `New response: ${data.leadName} · ${data.projectName}`,
    html: clientNewResponseEmail(data),
    text: `New response from ${data.leadName} on ${data.projectName}`,
  });
}

export async function notifyClientSendProof(data: {
  email: string;
  clientName: string;
  projectName: string;
  count?: number;
}) {
  const n = data.count || 1;
  return sendEmailSafe({
    to: data.email,
    subject: `Send proof uploaded · ${data.projectName}`,
    html: clientSendProofEmail({ ...data, count: n }),
    text: `New send proof on ${data.projectName}.`,
  });
}

export async function getClientEmailForProject(projectId: string): Promise<{
  email: string | null;
  clientName: string;
  projectName: string;
}> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select("name, clients ( name, email, user_id )")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return { email: null, clientName: "there", projectName: "Campaign" };

  const client = Array.isArray(project.clients) ? project.clients[0] : project.clients;
  let email = client?.email?.trim() || null;
  const clientName = client?.name?.split(" ")[0] || "there";
  const projectName = project.name || "Campaign";

  if (!email && client?.user_id) {
    const { data: userData } = await admin.auth.admin.getUserById(client.user_id);
    email = userData.user?.email || null;
  }

  return { email, clientName, projectName };
}

export async function getClientEmailById(clientId: string): Promise<{
  email: string | null;
  clientName: string;
  companyName: string | null;
  latestProject: { id: string; name: string; status: string } | null;
  projects: { id: string; name: string; status: string }[];
}> {
  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("name, email, user_id, company_name, projects(id, name, status, created_at)")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) {
    return { email: null, clientName: "there", companyName: null, latestProject: null, projects: [] };
  }

  const projectRows = Array.isArray(client.projects) ? client.projects : [];
  const sorted = [...projectRows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const projects = sorted.map((p) => ({ id: p.id, name: p.name, status: p.status }));
  const latestProject = projects[0] || null;

  let email = client.email?.trim() || null;
  if (!email && client.user_id) {
    const { data: userData } = await admin.auth.admin.getUserById(client.user_id);
    email = userData.user?.email || null;
  }

  const clientName = client.name?.split(" ")[0] || "there";
  return {
    email,
    clientName,
    companyName: client.company_name,
    latestProject,
    projects,
  };
}

export async function getProjectManagerEmails(projectId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("project_assignments")
    .select("team_members ( email, is_active )")
    .eq("project_id", projectId);

  const emails = new Set<string>();
  for (const row of rows || []) {
    const tm = row.team_members as { email?: string; is_active?: boolean } | { email?: string; is_active?: boolean }[] | null;
    const member = Array.isArray(tm) ? tm[0] : tm;
    if (member?.is_active !== false && member?.email?.trim()) {
      emails.add(member.email.trim());
    }
  }
  return Array.from(emails);
}

export async function notifyTeamClientFollowup(data: {
  projectId: string;
  projectName: string;
  clientName: string;
  leadName: string;
  message: string;
  isUpdate?: boolean;
}) {
  const managerEmails = await getProjectManagerEmails(data.projectId);
  const recipients = Array.from(new Set([getNotifyEmail(), ...managerEmails]));
  const subject = data.isUpdate
    ? `Follow-up updated: ${data.leadName} · ${data.projectName}`
    : `Client follow-up to send: ${data.leadName} · ${data.projectName}`;

  return sendEmailSafe({
    to: recipients,
    subject,
    html: teamClientFollowupEmail(data),
    text: `${data.clientName} wrote a follow-up for ${data.leadName}: ${data.message.slice(0, 200)}`,
  });
}
