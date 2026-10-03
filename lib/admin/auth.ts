import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export function isAdminAllowlisted(email: string | undefined) {
  if (!email) return false;
  const allowlist = process.env.ADMIN_EMAIL_ALLOWLIST
    ?.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(allowlist?.includes(email.toLowerCase()));
}

export async function hasAuthenticatedAdmin() {
  try {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.auth.getUser();
    return !error && isAdminAllowlisted(data.user?.email);
  } catch {
    return false;
  }
}