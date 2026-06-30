import { Resend } from "resend";
import {
  adminClientSignupEmail,
  adminContactEmail,
  clientCampaignLiveEmail,
  clientNewResponseEmail,
  clientSendProofEmail,
  clientVerifyEmail,
  clientWelcomeVerifiedEmail,
  teamClientFollowupEmail,
} from "@/lib/email-templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
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
  return sendEmailSafe({
    to: getNotifyEmail(),
    replyTo: data.email,
    subject: `New client signup: ${data.name}`,
    html: adminClientSignupEmail(data),
    text: `New client signup: ${data.name} (${data.email})`,
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

export async function notifyClientWelcomeVerified(data: { name: string; email: string }) {
  const first = data.name.trim().split(" ")[0];
  const site = getSiteUrl();
  return sendEmailSafe({
    to: data.email,
    subject: "You're verified — open your InMailly dashboard",
    html: clientWelcomeVerifiedEmail({ firstName: first }),
    text: `Hi ${first}, your dashboard is ready: ${site}/client/dashboard`,
  });
}

export async function notifyClientCampaignLive(data: {
  email: string;
  clientName: string;
  projectName: string;
}) {
  return sendEmailSafe({
    to: data.email,
    subject: `Campaign live: ${data.projectName}`,
    html: clientCampaignLiveEmail(data),
    text: `Your campaign "${data.projectName}" is now live.`,
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
