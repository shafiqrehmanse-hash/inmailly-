import { NextRequest, NextResponse } from "next/server";
import {
  createCampaignProfile,
  listCampaignProfilesForProject,
} from "@/lib/client-campaign-profiles";
import { extractLinkedInProfileFromScreenshot } from "@/lib/linkedin-profile-screenshot";
import { getCurrentMember } from "@/lib/team";
import { getMemberProject } from "@/lib/team-projects";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const project = await getMemberProject(member.id, projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found or not assigned to you" }, { status: 404 });
  }

  const admin = createAdminClient();
  try {
    const profiles = await listCampaignProfilesForProject(admin, projectId);
    return NextResponse.json({
      project: { id: project.id, name: project.name },
      clientId: project.client_id,
      profiles,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load profiles";
    if (message.includes("client_campaign_profiles")) {
      return NextResponse.json({ project: { id: project.id, name: project.name }, profiles: [] });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const project = await getMemberProject(member.id, projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found or not assigned to you" }, { status: 404 });
  }

  if (!project.client_id) {
    return NextResponse.json({ error: "Project has no linked client" }, { status: 400 });
  }

  if (!imageDataUrl) {
    return NextResponse.json({ error: "Paste a LinkedIn profile screenshot first" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const extracted = await extractLinkedInProfileFromScreenshot(imageDataUrl);
    const existing = await listCampaignProfilesForProject(admin, projectId);
    const profile = await createCampaignProfile(admin, {
      project_id: projectId,
      client_id: project.client_id,
      sort_order: existing.length,
      ...extracted,
    });

    return NextResponse.json({ success: true, profile, extracted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not add profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileId = request.nextUrl.searchParams.get("profileId");
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!profileId || !projectId) {
    return NextResponse.json({ error: "profileId and projectId are required" }, { status: 400 });
  }

  const project = await getMemberProject(member.id, projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found or not assigned to you" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { deleteCampaignProfile } = await import("@/lib/client-campaign-profiles");

  try {
    await deleteCampaignProfile(admin, profileId, projectId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not delete profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
