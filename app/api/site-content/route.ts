import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/site-content-server";

export const revalidate = 60;

export async function GET() {
  const content = await getSiteContent();
  return NextResponse.json({ content });
}
