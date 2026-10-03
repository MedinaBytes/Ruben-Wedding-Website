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

export async function getAuthenticatedAdminIdentity() {
  try {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.auth.getUser();
    const email = data.user?.email;
    if (error || !data.user?.id || !email || !isAdminAllowlisted(email)) return null;
    return { id: data.user.id, email };
  } catch {
    return null;
  }
}

export async function hasAuthenticatedAdmin() {
  return (await getAuthenticatedAdminIdentity()) !== null;
}
