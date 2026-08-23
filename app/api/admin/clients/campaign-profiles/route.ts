import { NextRequest, NextResponse } from "next/server";
import {
  createCampaignProfile,
  deleteCampaignProfile,
  listCampaignProfilesForProject,
} from "@/lib/client-campaign-profiles";
import { extractLinkedInProfileFromScreenshot } from "@/lib/linkedin-profile-screenshot";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  try {
    const profiles = await listCampaignProfilesForProject(admin, projectId);
    return NextResponse.json({ profiles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load profiles";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    projectId,
    clientId,
    imageDataUrl,
    display_name,
    headline,
    title,
    linkedin_url,
    profile_photo_data,
    cover_photo_data,
    card_preview_data,
  } = body as {
    projectId?: string;
    clientId?: string;
    imageDataUrl?: string;
    display_name?: string;
    headline?: string;
    title?: string;
    linkedin_url?: string;
    profile_photo_data?: string;
    cover_photo_data?: string;
    card_preview_data?: string;
  };

  if (!projectId || !clientId) {
    return NextResponse.json({ error: "projectId and clientId are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    let fields: {
      display_name: string;
      headline?: string | null;
      title?: string | null;
      linkedin_url?: string | null;
      profile_photo_data?: string | null;
      cover_photo_data?: string | null;
      card_preview_data?: string | null;
    };

    if (imageDataUrl?.trim()) {
      const extracted = await extractLinkedInProfileFromScreenshot(imageDataUrl.trim());
      fields = extracted;
    } else if (display_name?.trim() && profile_photo_data) {
      fields = {
        display_name: display_name.trim(),
        headline: headline?.trim() || null,
        title: title?.trim() || null,
        linkedin_url: linkedin_url?.trim() || null,
        profile_photo_data,
        cover_photo_data: cover_photo_data || null,
        card_preview_data: card_preview_data || null,
      };
    } else {
      return NextResponse.json(
        { error: "Paste a LinkedIn profile screenshot (imageDataUrl) or provide extracted profile fields" },
        { status: 400 }
      );
    }

    const existing = await listCampaignProfilesForProject(admin, projectId);
    const profile = await createCampaignProfile(admin, {
      project_id: projectId,
      client_id: clientId,
      sort_order: existing.length,
      ...fields,
    });

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not add profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = request.nextUrl.searchParams.get("profileId");
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!profileId || !projectId) {
    return NextResponse.json({ error: "profileId and projectId are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  try {
    await deleteCampaignProfile(admin, profileId, projectId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not delete profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
