import { NextResponse } from "next/server";
import { z } from "zod";

import {
  consumeInvitationRateLimit,
  findActiveInvitation,
  recordInvitationEvent,
} from "@/lib/invitations/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supportedLocales } from "@/lib/wedding-config";
import { invalidOriginResponse, isJsonRequest, isSameOriginMutation, privateApiHeaders } from "@/lib/security/request";

const eventPayloadSchema = z
  .object({
    sessionId: z.string().uuid(),
    locale: z.enum(supportedLocales),
  })
  .strict();

const privateHeaders = privateApiHeaders();

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (!isSameOriginMutation(request)) return invalidOriginResponse();
  if (!isJsonRequest(request)) {
    return NextResponse.json({ error: "invalid_content_type" }, { status: 415, headers: privateHeaders });
  }

  const { token } = await context.params;

  try {
    const client = createSupabaseAdminClient();
    const invitation = await findActiveInvitation(client, token);
    if (!invitation) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: privateHeaders });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });
    }

    const result = eventPayloadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "invalid_request" }, { status: 422, headers: privateHeaders });
    }

    const isAllowed = await consumeInvitationRateLimit(client, invitation.id, "event", 20, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: privateHeaders });
    }

    await recordInvitationEvent(client, {
      invitationId: invitation.id,
      sessionId: result.data.sessionId,
      eventType: "INVITE_OPENED",
      locale: result.data.locale,
    });

    return NextResponse.json({ recorded: true }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503, headers: privateHeaders });
  }
}
