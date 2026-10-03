"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { isAdminAllowlisted } from "@/lib/admin/auth";
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

  redirect("/admin");
}

export async function signOutAdmin() {
  try {
    const client = await createSupabaseServerClient();
    await client.auth.signOut();
  } catch {
    redirect("/admin");
  }

  redirect("/admin");
}