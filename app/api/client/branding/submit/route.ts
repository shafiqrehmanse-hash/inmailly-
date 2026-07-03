import { NextRequest, NextResponse } from "next/server";
import { submitClientBranding } from "@/lib/client-branding";
import { getCurrentClient } from "@/lib/client-auth-server";
import { notifyAdminBrandingSubmitted } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    request_id,
    inmail_subject,
    inmail_script,
    sales_nav_direct_link,
    sales_nav_link_count,
    profile_links_paste,
  } = body as {
    request_id?: string;
    inmail_subject?: string;
    inmail_script?: string;
    sales_nav_direct_link?: string;
    sales_nav_link_count?: number | string;
    profile_links_paste?: string;
  };

  if (!request_id) {
    return NextResponse.json({ error: "request_id is required" }, { status: 400 });
  }

  const subject = inmail_subject?.trim();
  const script = inmail_script?.trim();
  const salesLink = sales_nav_direct_link?.trim();
  const count =
    typeof sales_nav_link_count === "number"
      ? sales_nav_link_count
      : parseInt(String(sales_nav_link_count || ""), 10);

  if (!subject || subject.length < 3) {
    return NextResponse.json({ error: "InMail subject is required (min 3 characters)" }, { status: 400 });
  }
  if (!script || script.length < 20) {
    return NextResponse.json({ error: "InMail script is required (min 20 characters)" }, { status: 400 });
  }
  if (!salesLink || !/^https?:\/\//i.test(salesLink)) {
    return NextResponse.json({ error: "Sales Nav direct link must be a valid URL" }, { status: 400 });
  }
  if (!Number.isFinite(count) || count <= 0) {
    return NextResponse.json({ error: "Sales Nav send count must be a positive number" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const { projectId, profileLinksParsed } = await submitClientBranding(admin, request_id, client.id, {
      inmail_subject: subject,
      inmail_script: script,
      sales_nav_direct_link: salesLink,
      sales_nav_link_count: count,
      profile_links_paste: profile_links_paste?.trim() || null,
    });

    const { data: project } = await admin
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .maybeSingle();

    await notifyAdminBrandingSubmitted({
      clientName: client.name,
      companyName: client.company_name,
      projectName: project?.name || "Campaign",
      inmailSubject: subject,
      salesNavLinkCount: count,
      profileLinksParsed: profileLinksParsed ?? undefined,
    });

    return NextResponse.json({ success: true, profileLinksParsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit branding";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
