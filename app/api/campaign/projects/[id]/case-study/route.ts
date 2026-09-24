import { NextResponse } from "next/server";
import { assembleProjectCaseStudy } from "@/lib/case-study";
import { caseStudyFilename, generateProjectCaseStudyPdf } from "@/lib/case-study-pdf";
import { assertProjectAccess, getCampaignMember } from "@/lib/campaign-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const member = await getCampaignMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await assertProjectAccess(member.id, params.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
