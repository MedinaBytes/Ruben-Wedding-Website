import { NextResponse } from "next/server";

import { findActiveInvitationByToken } from "@/lib/invitations/store";
import { privateApiHeaders } from "@/lib/security/request";

const privateHeaders = privateApiHeaders();

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  try {
    const invitation = await findActiveInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: privateHeaders });
    }

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          displayName: invitation.display_name,
          greeting: invitation.greeting_override,
          language: invitation.language,
          maxGuests: invitation.max_guests,
          plusOneAllowed: invitation.plus_one_allowed,
          personalMessage: invitation.personal_message,
        },
      },
      { headers: privateHeaders },
    );
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503, headers: privateHeaders });
  }
}
