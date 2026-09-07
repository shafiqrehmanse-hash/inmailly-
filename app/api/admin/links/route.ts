import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

function searchPattern(raw: string | null) {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/[%*,()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 160);
  if (cleaned.length < 2) return null;
  return `%${cleaned}%`;
}

function withFilters<T>(query: T, opts: { status?: string | null; memberId?: string | null; q?: string | null }): T {
  let next = query as T & { eq: (c: string, v: string) => T; or: (f: string) => T };
  if (opts.status && opts.status !== "all") next = next.eq("status", opts.status) as typeof next;
  if (opts.memberId && opts.memberId !== "all") next = next.eq("member_id", opts.memberId) as typeof next;
  if (opts.q) {
    next = next.or(
      [
        `url.ilike."${opts.q}"`,
        `url_key.ilike."${opts.q}"`,
        `smart_label.ilike."${opts.q}"`,
        `batch_name.ilike."${opts.q}"`,
        `first_name.ilike."${opts.q}"`,
        `last_name.ilike."${opts.q}"`,
        `notes.ilike."${opts.q}"`,
        `added_by.ilike."${opts.q}"`,
      ].join(",")
    ) as typeof next;
  }
  return next;
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = request.nextUrl.searchParams.get("status");
  const memberId = request.nextUrl.searchParams.get("memberId");
  const q = searchPattern(request.nextUrl.searchParams.get("q"));
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "10", 10) || 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const admin = createAdminClient();
  let query = admin
    .from("outreach_links")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  query = withFilters(query, { status, memberId, q });
  const { data, count, error } = await query.range(from, to);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const total = count || 0;
  return NextResponse.json({
    links: data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

export async function DELETE(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const admin = createAdminClient();

  if (Array.isArray(body.linkIds) && body.linkIds.length > 0) {
    const ids = (body.linkIds as unknown[])
      .filter((id): id is string => typeof id === "string" && id.length > 8)
      .slice(0, 200);
    if (!ids.length) {
      return NextResponse.json({ error: "No valid link ids" }, { status: 400 });
    }
    const { error, count } = await admin.from("outreach_links").delete({ count: "exact" }).in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: count ?? ids.length });
  }

  if (body.deleteMatching) {
    const q = searchPattern(typeof body.q === "string" ? body.q : "");
    const status = typeof body.status === "string" ? body.status : "all";
    const memberId = typeof body.memberId === "string" ? body.memberId : "all";
    if (!q && status === "all" && memberId === "all") {
      return NextResponse.json(
        { error: "Pick a status (claimed, used, or available) or search first. Will not delete the entire pool." },
        { status: 400 }
      );
    }

    let deleted = 0;
    for (let round = 0; round < 80; round++) {
      let idQuery = admin.from("outreach_links").select("id").limit(500);
      idQuery = withFilters(idQuery, { status, memberId, q });
      const { data: rows, error: listError } = await idQuery;
      if (listError) return NextResponse.json({ error: listError.message, deleted }, { status: 500 });
      const ids = (rows || []).map((r) => r.id);
      if (!ids.length) {
        return NextResponse.json({ deleted, capped: false });
      }
      const { error, count } = await admin.from("outreach_links").delete({ count: "exact" }).in("id", ids);
      if (error) return NextResponse.json({ error: error.message, deleted }, { status: 500 });
      deleted += count ?? ids.length;
    }

    return NextResponse.json({ deleted, capped: true });
  }

  return NextResponse.json({ error: "linkIds or deleteMatching required" }, { status: 400 });
}
