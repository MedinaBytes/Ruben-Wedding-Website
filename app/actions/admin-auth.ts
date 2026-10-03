"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAdminAudit } from "@/lib/admin/audit";
import { getAuthenticatedAdminIdentity, isAdminAllowlisted } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(256),
});

export async function signInAdmin(formData: FormData) {
  const credentials = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!credentials.success) redirect("/admin?error=credentials");

  let client;
  try {
    client = await createSupabaseServerClient();
  } catch {
    redirect("/admin?error=setup");
  }

  const { data, error } = await client.auth.signInWithPassword(credentials.data);
  if (error || !isAdminAllowlisted(data.user?.email)) {
    await client.auth.signOut();
    redirect("/admin?error=credentials");
  }

  if (data.user?.id && data.user.email) {
    await recordAdminAudit({
      actor: { id: data.user.id, email: data.user.email },
      action: "ADMIN_SIGNED_IN",
      resourceType: "admin_session",
    }).catch(() => undefined);
  }

  redirect("/admin");
}

export async function signOutAdmin() {
  try {
    const actor = await getAuthenticatedAdminIdentity();
    if (actor) {
      await recordAdminAudit({
        actor,
        action: "ADMIN_SIGNED_OUT",
        resourceType: "admin_session",
      }).catch(() => undefined);
    }
    const client = await createSupabaseServerClient();
    await client.auth.signOut();
  } catch {
    redirect("/admin");
  }

  redirect("/admin");
}
