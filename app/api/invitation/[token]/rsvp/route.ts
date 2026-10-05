import { NextResponse } from "next/server";

import {
  consumeInvitationRateLimit,
  findActiveInvitation,
  recordInvitationEvent,
  saveRsvp,
} from "@/lib/invitations/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { invalidOriginResponse, isJsonRequest, isSameOriginMutation, privateApiHeaders } from "@/lib/security/request";
import { validateRsvpForInvitation } from "@/lib/validation/guest";

const privateHeaders = privateApiHeaders();

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
      .from("rsvps")
      .select("attendance_status, attendee_count, guest_names, dietary_requirements, notes")
      .eq("invitation_id", invitation.id)
      .maybeSingle();

    const { resilientStore } = await import("@/lib/storage/resilient-store");
    const local = resilientStore.getRsvp(invitation.id);
    const rsvpSource: any = data || (local ? {
      attendance_status: local.attendance_status,
      attendee_count: local.attendee_count,
      guest_names: local.guest_names,
      dietary_requirements: local.dietary_requirements,
      notes: local.notes,
      meal_preferences: local.meal_preferences,
    } : null);

    return NextResponse.json(
      {
        rsvp: rsvpSource
          ? {
              attendanceStatus: rsvpSource.attendance_status,
              attendeeCount: rsvpSource.attendee_count,
              guestNames: rsvpSource.guest_names,
              dietaryRequirements: rsvpSource.dietary_requirements,
              notes: rsvpSource.notes,
              mealPreferences: rsvpSource.meal_preferences || [],
            }
          : null,
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

    const isAllowed = await consumeInvitationRateLimit(client, invitation.id, "rsvp", 5, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: privateHeaders });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });
    }

    const result = validateRsvpForInvitation(body, {
      maxGuests: invitation.max_guests,
      plusOneAllowed: invitation.plus_one_allowed,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.reason }, { status: 422, headers: privateHeaders });
    }

    await saveRsvp(client, invitation.id, result.data);
    await recordInvitationEvent(client, {
      invitationId: invitation.id,
      eventType: result.data.attendanceStatus === "yes" ? "RSVP_CONFIRMED" : "RSVP_DECLINED",
      locale: result.data.language,
    }).catch(() => undefined);

    return NextResponse.json({ saved: true }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503, headers: privateHeaders });
  }
}
