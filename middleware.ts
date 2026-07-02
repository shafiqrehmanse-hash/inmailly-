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

  const isCampaignAuth = pathname === "/campaign/login";
  const isClientAuth = pathname === "/client/login" || pathname === "/client/register";

  if (pathname.startsWith("/team") && !isTeamAuth && !user) {
    return NextResponse.redirect(new URL("/team/login", request.url));
  }

  if (pathname.startsWith("/team") && !isTeamAuth && user && !verified) {
    return NextResponse.redirect(new URL("/team/login?verify=required", request.url));
  }

  if (pathname.startsWith("/campaign") && !isCampaignAuth && !user) {
    return NextResponse.redirect(new URL("/campaign/login", request.url));
  }

  if (pathname.startsWith("/campaign") && !isCampaignAuth && user && !verified) {
    return NextResponse.redirect(new URL("/campaign/login?verify=required", request.url));
  }

  if ((isTeamAuth || isCampaignAuth || isClientAuth) && user && verified) {
    const home = await resolveVerifiedHome(user.id);
    if (home) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  if (pathname.startsWith("/client/dashboard") && !user) {
    return NextResponse.redirect(new URL("/client/login", request.url));
  }

  if (pathname.startsWith("/client/dashboard") && user && !verified) {
    return NextResponse.redirect(new URL("/client/login?verify=required", request.url));
  }

  if (pathname.startsWith("/client/contract") && !user) {
    return NextResponse.redirect(new URL("/client/login", request.url));
  }

  if (pathname.startsWith("/client/contract") && user && !verified) {
    return NextResponse.redirect(new URL("/client/login?verify=required", request.url));
  }

  if (pathname.startsWith("/client/branding") && !user) {
    return NextResponse.redirect(new URL("/client/login", request.url));
  }

  if (pathname.startsWith("/client/branding") && user && !verified) {
    return NextResponse.redirect(new URL("/client/login?verify=required", request.url));
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
    "/campaign/:path*",
    "/client",
    "/client/dashboard",
    "/client/contract",
    "/client/login",
    "/client/register",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
