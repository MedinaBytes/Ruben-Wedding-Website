"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const lookupSchema = z.string().trim().min(2).max(100);

export type LookupResult =
  | { success: true; url: string; displayName: string }
  | { success: false; reason: "not_found" | "error" | "invalid" };

export async function lookupInvitation(query: string): Promise<LookupResult> {
  const parsed = lookupSchema.safeParse(query);
  if (!parsed.success) {
    return { success: false, reason: "invalid" };
  }

  try {
    const client = createSupabaseAdminClient();
    const searchTerm = parsed.data;

    // Search active invitations matching display_name or group_name
    const { data, error } = await client
      .from("invitations")
      .select("token, display_name, status")
      .eq("status", "active")
      .or(`display_name.ilike.%${searchTerm}%,group_name.ilike.%${searchTerm}%`)
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.token) {
      return { success: false, reason: "not_found" };
    }

    return {
      success: true,
      url: `/i/${data.token}`,
      displayName: data.display_name,
    };
  } catch {
    return { success: false, reason: "error" };
  }
}
