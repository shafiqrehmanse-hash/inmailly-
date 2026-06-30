import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function generateVerificationLink(
  admin: AdminClient,
  email: string,
  redirectNext: string,
  password?: string
) {
  const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(redirectNext)}`;

  if (password) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { redirectTo },
    });
    if (!error && data.properties?.action_link) {
      return { verifyUrl: data.properties.action_link };
    }
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error || !data.properties?.action_link) {
    return { error: error?.message || "Could not generate verify link" };
  }

  return { verifyUrl: data.properties.action_link };
}
