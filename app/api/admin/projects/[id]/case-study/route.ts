import { NextRequest, NextResponse } from "next/server";
import { assembleProjectCaseStudy } from "@/lib/case-study";
import { caseStudyFilename, generateProjectCaseStudyPdf } from "@/lib/case-study-pdf";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

export const maxDuration = 60;

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const study = await assembleProjectCaseStudy(admin, params.id);
  if (!study) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const pdf = await generateProjectCaseStudyPdf(study);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${caseStudyFilename(study.companyName)}"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not build the case study PDF" },
      { status: 500 }
    );
  }
}
