import { NextResponse } from "next/server";

import {
  consumeInvitationRateLimit,
  findActiveInvitation,
  recordInvitationEvent,
  saveSongRequests,
} from "@/lib/invitations/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { songRequestPayloadSchema } from "@/lib/validation/guest";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  try {
    const client = createSupabaseAdminClient();
    const invitation = await findActiveInvitation(client, token);
    if (!invitation) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: privateHeaders });
    }

    const { data, error } = await client
      .from("song_requests")
      .select("song_title, artist, spotify_url, slot")
      .eq("invitation_id", invitation.id)
      .order("slot");

    if (error) throw new Error("Song request lookup failed.");

    return NextResponse.json(
      {
        requests: (data ?? []).map((request) => ({
          title: request.song_title,
          artist: request.artist,
          spotifyUrl: request.spotify_url,
        })),
      },
      { headers: privateHeaders },
    );
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503, headers: privateHeaders });
  }
}

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

    const isAllowed = await consumeInvitationRateLimit(client, invitation.id, "songs", 5, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: privateHeaders });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });
    }

    if (
      typeof body === "object" &&
      body !== null &&
      "requests" in body &&
      Array.isArray(body.requests) &&
      body.requests.length > 3
    ) {
      return NextResponse.json({ error: "too_many_songs" }, { status: 422, headers: privateHeaders });
    }

    const result = songRequestPayloadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "invalid_request" }, { status: 422, headers: privateHeaders });
    }

    await saveSongRequests(client, invitation.id, result.data);
    if (result.data.requests.length > 0) {
      await recordInvitationEvent(client, {
        invitationId: invitation.id,
        eventType: "SONG_REQUESTED",
        locale: result.data.language,
      }).catch(() => undefined);
    }

    return NextResponse.json({ saved: true }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503, headers: privateHeaders });
  }
}