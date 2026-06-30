import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { handlePostEmailVerification } from "@/lib/post-verification";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/client/dashboard";

  const response = NextResponse.redirect(new URL(next, origin));

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
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  let verified = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const isTeam = next.startsWith("/team");
      return NextResponse.redirect(
        new URL(`${isTeam ? "/team" : "/client"}/login?error=verify_failed`, origin)
      );
    }
    verified = true;
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "email" | "recovery" | "email_change" | "magiclink",
    });
    if (error) {
      const isTeam = next.startsWith("/team");
      return NextResponse.redirect(
        new URL(`${isTeam ? "/team" : "/client"}/login?error=verify_failed`, origin)
      );
    }
    verified = true;
  } else {
    return NextResponse.redirect(new URL("/client/login?error=missing_token", origin));
  }

  if (verified) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        await handlePostEmailVerification(user);
      } catch (e) {
        console.error("[auth/callback] post-verification notify failed:", e);
      }
    }
  }

  return response;
}
