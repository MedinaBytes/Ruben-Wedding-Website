"use server";

import { z } from "zod";

import { normalizeLookupValue } from "@/lib/invitations/lookup-normalize";
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
    const searchTerm = normalizeLookupValue(parsed.data);

    const baseQuery = client
      .from("invitations")
      .select("token, display_name, status")
      .eq("status", "active");

    let response;
    if (searchTerm.includes("@")) {
      response = await baseQuery.eq("normalized_email", searchTerm).limit(1).maybeSingle();
    } else if (/^\d+$/.test(searchTerm)) {
      response = await baseQuery
        .or(`normalized_phone.eq.${searchTerm},normalized_whatsapp.eq.${searchTerm}`)
        .limit(1)
        .maybeSingle();
    } else {
      response = await baseQuery
        .or(`display_name.ilike.%${searchTerm}%,group_name.ilike.%${searchTerm}%,normalized_name.ilike.%${searchTerm}%`)
        .limit(1)
        .maybeSingle();
    }

    const { data, error } = response;

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
