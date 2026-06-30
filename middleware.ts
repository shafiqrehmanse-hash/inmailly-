import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { resolveVerifiedHome } from "@/lib/account-redirect";

function isEmailVerified(user: { email_confirmed_at?: string | null }) {
  return Boolean(user.email_confirmed_at);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });
  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const verified = user ? isEmailVerified(user) : false;

  const isTeamAuth =
    pathname === "/team/login" ||
    pathname === "/team/register" ||
    pathname === "/login" ||
    pathname === "/register";

  const isClientAuth = pathname === "/client/login" || pathname === "/client/register";

  if (pathname.startsWith("/team") && !isTeamAuth && !user) {
    return NextResponse.redirect(new URL("/team/login", request.url));
  }

  if (pathname.startsWith("/team") && !isTeamAuth && user && !verified) {
    return NextResponse.redirect(new URL("/team/login?verify=required", request.url));
  }

  if (isTeamAuth && user && verified) {
    return NextResponse.redirect(new URL("/team/hub", request.url));
  }

  if (pathname.startsWith("/client/dashboard") && !user) {
    return NextResponse.redirect(new URL("/client/login", request.url));
  }

  if (pathname.startsWith("/client/dashboard") && user && !verified) {
    return NextResponse.redirect(new URL("/client/login?verify=required", request.url));
  }

  if (user && verified) {
    const isClientArea =
      pathname.startsWith("/client/dashboard") ||
      pathname === "/client/login" ||
      pathname === "/client/register";
    if (isClientArea) {
      const home = await resolveVerifiedHome(user.id);
      if (home && !home.startsWith("/client")) {
        return NextResponse.redirect(new URL(home, request.url));
      }
    }
  }

  if (isClientAuth && user && verified) {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (client) {
      return NextResponse.redirect(new URL("/client/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (request.cookies.get("admin_authed")?.value !== "1") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname === "/admin/login" && request.cookies.get("admin_authed")?.value === "1") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/team/:path*",
    "/client/dashboard",
    "/client/login",
    "/client/register",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
