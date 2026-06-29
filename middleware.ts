import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  const isTeamAuth =
    pathname === "/team/login" ||
    pathname === "/team/register" ||
    pathname === "/login" ||
    pathname === "/register";

  if (pathname.startsWith("/team") && !isTeamAuth && !user) {
    return NextResponse.redirect(new URL("/team/login", request.url));
  }

  if (isTeamAuth && user) {
    return NextResponse.redirect(new URL("/team/hub", request.url));
  }

  if (pathname === "/admin" && request.cookies.get("admin_authed")?.value !== "1") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (pathname === "/admin/login" && request.cookies.get("admin_authed")?.value === "1") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/team/:path*", "/admin", "/admin/login", "/login", "/register"],
};
