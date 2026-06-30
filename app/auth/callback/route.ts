import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { resolvePostVerifyRedirect } from "@/lib/account-redirect";
import { handlePostEmailVerification } from "@/lib/post-verification";

function verifyErrorLogin(nextParam?: string | null) {
  if (nextParam?.startsWith("/client")) return "/client/login";
  if (nextParam?.startsWith("/campaign")) return "/campaign/login";
  return "/team/login";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next");

  let response = NextResponse.redirect(new URL("/team/login?verified=1", origin));

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
      return NextResponse.redirect(
        new URL(`${verifyErrorLogin(nextParam)}?error=verify_failed`, origin)
      );
    }
    verified = true;
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "email" | "recovery" | "email_change" | "magiclink",
    });
    if (error) {
      return NextResponse.redirect(
        new URL(`${verifyErrorLogin(nextParam)}?error=verify_failed`, origin)
      );
    }
    verified = true;
  } else {
    return NextResponse.redirect(
      new URL(`${verifyErrorLogin(nextParam)}?error=missing_token`, origin)
    );
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

      const destination = await resolvePostVerifyRedirect(user.id, nextParam);
      const redirect = NextResponse.redirect(new URL(destination, origin));
      response.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie);
      });
      response = redirect;
    }
  }

  return response;
}
