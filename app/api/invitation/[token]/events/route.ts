import { NextResponse } from "next/server";
import { z } from "zod";

import {
  consumeInvitationRateLimit,
  findActiveInvitation,
  recordInvitationEvent,
} from "@/lib/invitations/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supportedLocales } from "@/lib/wedding-config";

const eventPayloadSchema = z
  .object({
    sessionId: z.string().uuid(),
    eventType: z.enum(["RSVP_STARTED", "LANGUAGE_CHANGED", "MAP_OPENED", "PLAYLIST_OPENED"]),
    locale: z.enum(supportedLocales),
  })
  .strict();

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
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
      eventType: result.data.eventType,
      locale: result.data.locale,
    });

    return NextResponse.json({ recorded: true }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503, headers: privateHeaders });
  }
}