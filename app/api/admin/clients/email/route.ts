import { NextRequest, NextResponse } from "next/server";
import {
  getClientEmailById,
  getNotifyEmail,
  isEmailConfigured,
  notifyClientCampaignFinished,
  notifyClientCampaignStarted,
  notifyClientCustom,
} from "@/lib/email";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    configured: isEmailConfigured(),
    notifyEmail: getNotifyEmail(),
    from: process.env.EMAIL_FROM || "InMailly <notifications@inmailly.com>",
  });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email is not configured. Add RESEND_API_KEY and EMAIL_FROM in Vercel env vars, then redeploy.",
      },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { client_id, action, project_id, subject, message } = body as {
    client_id?: string;
    action?: "campaign_started" | "campaign_finished" | "custom";
    project_id?: string;
    subject?: string;
    message?: string;
  };

  if (!client_id || !action) {
    return NextResponse.json({ error: "client_id and action are required" }, { status: 400 });
  }

  const clientInfo = await getClientEmailById(client_id);
  if (!clientInfo.email) {
    return NextResponse.json(
      { error: "No email on file for this client. Add their email in Edit, or link a Supabase auth account." },
      { status: 400 }
    );
  }

  const project =
    (project_id && clientInfo.projects.find((p) => p.id === project_id)) ||
    clientInfo.latestProject;

  if ((action === "campaign_started" || action === "campaign_finished") && !project) {
    return NextResponse.json({ error: "Client has no project — create one in Projects tab first." }, { status: 400 });
  }

  const admin = createAdminClient();
  const projectName = project?.name || "Your campaign";
  const clientName = clientInfo.clientName;

  if (action === "campaign_started") {
    const result = await notifyClientCampaignStarted({
      email: clientInfo.email,
      clientName,
      projectName,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.skipped ? "Email skipped — RESEND_API_KEY missing" : result.error || "Send failed" },
        { status: 502 }
      );
    }
    if (project && project.status !== "active") {
      await admin.from("projects").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", project.id);
    }
    return NextResponse.json({ success: true, sentTo: clientInfo.email, projectActivated: project?.status !== "active" });
  }

  if (action === "campaign_finished") {
    const result = await notifyClientCampaignFinished({
      email: clientInfo.email,
      clientName,
      projectName,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.skipped ? "Email skipped — RESEND_API_KEY missing" : result.error || "Send failed" },
        { status: 502 }
      );
    }
    if (project && project.status !== "completed") {
      await admin.from("projects").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", project.id);
    }
    return NextResponse.json({ success: true, sentTo: clientInfo.email, projectCompleted: project?.status !== "completed" });
  }

  if (action === "custom") {
    const subj = subject?.trim();
    const msg = message?.trim();
    if (!subj || subj.length < 3) {
      return NextResponse.json({ error: "Subject is required (min 3 characters)" }, { status: 400 });
    }
    if (!msg || msg.length < 10) {
      return NextResponse.json({ error: "Message is required (min 10 characters)" }, { status: 400 });
    }

    const result = await notifyClientCustom({
      email: clientInfo.email,
      clientName,
      subject: subj,
      message: msg,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.skipped ? "Email skipped — RESEND_API_KEY missing" : result.error || "Send failed" },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, sentTo: clientInfo.email });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
