import { NextResponse } from "next/server";

import { recordAdminAudit } from "@/lib/admin/audit";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { generateInvitationToken, hashInvitationToken } from "@/lib/invitations/token";
import { invalidOriginResponse, isJsonRequest, isSameOriginMutation } from "@/lib/security/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createInvitationSchema } from "@/lib/validation/admin";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function POST(request: Request) {
  const actor = await getAuthenticatedAdminIdentity();
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }
  if (!isSameOriginMutation(request)) return invalidOriginResponse();
  if (!isJsonRequest(request)) {
    return NextResponse.json({ error: "invalid_content_type" }, { status: 415, headers: privateHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });
  }

  const payload = createInvitationSchema.safeParse(body);
  if (!payload.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 422, headers: privateHeaders });
  }

  const client = createSupabaseAdminClient();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = generateInvitationToken();
    const { data, error } = await client
      .from("invitations")
      .insert({
        token_hash: hashInvitationToken(token),
        display_name: payload.data.displayName,
        greeting_override: payload.data.greetingOverride ?? null,
        language: payload.data.language ?? null,
        group_name: payload.data.groupName ?? null,
        max_guests: payload.data.maxGuests,
        plus_one_allowed: payload.data.plusOneAllowed,
        personal_message: payload.data.personalMessage ?? null,
        status: payload.data.status,
      })
      .select("id, display_name, status")
      .single();

    if (!error && data) {
      try {
        await recordAdminAudit({
          actor,
          action: "INVITATION_CREATED",
          resourceType: "invitation",
          resourceId: data.id,
          metadata: { status: data.status, maxGuests: payload.data.maxGuests },
        });
      } catch {
        await client.from("invitations").delete().eq("id", data.id);
        return NextResponse.json({ error: "audit_unavailable" }, { status: 503, headers: privateHeaders });
      }

      const invitationUrl = new URL(`/i/${token}`, request.url).toString();
      return NextResponse.json(
        { invitation: { id: data.id, displayName: data.display_name, status: data.status, url: invitationUrl } },
        { status: 201, headers: privateHeaders },
      );
    }

    if (error?.code !== "23505") {
      return NextResponse.json({ error: "service_unavailable" }, { status: 503, headers: privateHeaders });
    }
  }

  return NextResponse.json({ error: "service_unavailable" }, { status: 503, headers: privateHeaders });
}
