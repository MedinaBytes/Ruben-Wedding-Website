import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { hashInvitationToken, invitationTokenSchema } from "@/lib/invitations/token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resilientStore } from "@/lib/storage/resilient-store";
import type { Locale } from "@/lib/wedding-config";
import type { RsvpPayload, SongRequestPayload } from "@/lib/validation/guest";

export type ActiveInvitation = {
  id: string;
  display_name: string;
  greeting_override: string | null;
  language: Locale | null;
  max_guests: number;
  plus_one_allowed: boolean;
  personal_message: string | null;
  status: "active";
};

export const DEMO_INVITATION: ActiveInvitation = {
  id: "00000000-0000-0000-0000-000000000001",
  display_name: "Sarah & Guest (Demo)",
  greeting_override: "Dear Sarah & Guest,",
  language: "en",
  max_guests: 2,
  plus_one_allowed: true,
  personal_message: "We would be absolutely thrilled to celebrate this unforgettable day in Vienna with you!",
  status: "active",
};

export function getInvitationTokenHash(token: string) {
  if (!invitationTokenSchema.safeParse(token).success) return null;
  return hashInvitationToken(token);
}

export async function findActiveInvitation(client: SupabaseClient, token: string) {
  if (token === "demo" || token === DEMO_INVITATION.id) {
    return DEMO_INVITATION;
  }

  // Check local store first or as fallback
  const localMatch = resilientStore.getInvitationByToken(token);

  const tokenHash = getInvitationTokenHash(token);
  if (!tokenHash) {
    if (localMatch) {
      return {
        id: localMatch.id,
        display_name: localMatch.display_name,
        greeting_override: null,
        language: localMatch.language as Locale | null,
        max_guests: localMatch.max_guests,
        plus_one_allowed: localMatch.plus_one_allowed,
        personal_message: localMatch.personal_message,
        status: "active",
      };
    }
    return null;
  }

  try {
    const { data: directInvitation, error: directError } = await client
      .from("invitations")
      .select("id, display_name, greeting_override, language, max_guests, plus_one_allowed, personal_message, status")
      .eq("token_hash", tokenHash)
      .eq("status", "active")
      .maybeSingle();

    if (!directError && directInvitation) return directInvitation as ActiveInvitation;
  } catch {}

  if (tokenHash) {
    try {
      const { data: alias, error: aliasError } = await client
        .from("invitation_token_aliases")
        .select("invitation_id")
        .eq("token_hash", tokenHash)
        .maybeSingle();

      if (!aliasError && alias) {
        const { data, error } = await client
          .from("invitations")
          .select("id, display_name, greeting_override, language, max_guests, plus_one_allowed, personal_message, status")
          .eq("id", alias.invitation_id)
          .eq("status", "active")
          .maybeSingle();

        if (!error && data) return data as ActiveInvitation;
      }
    } catch {}
  }

  if (localMatch) {
    return {
      id: localMatch.id,
      display_name: localMatch.display_name,
      greeting_override: null,
      language: localMatch.language as Locale | null,
      max_guests: localMatch.max_guests,
      plus_one_allowed: localMatch.plus_one_allowed,
      personal_message: localMatch.personal_message,
      status: "active",
    };
  }

  return null;
}

export async function findActiveInvitationByToken(token: string) {
  try {
    const client = createSupabaseAdminClient();
    return await findActiveInvitation(client, token);
  } catch {
    return await findActiveInvitation(null as unknown as SupabaseClient, token);
  }
}

export async function consumeInvitationRateLimit(
  client: SupabaseClient,
  invitationId: string,
  action: "rsvp" | "songs" | "spotify_search" | "event",
  limit: number,
  windowSeconds: number,
) {
  if (invitationId === DEMO_INVITATION.id) return true;

  try {
    const { data, error } = await client.rpc("consume_invitation_rate_limit", {
      p_invitation_id: invitationId,
      p_action: action,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (!error && typeof data === "boolean") return data;
  } catch {}

  return true; // Fallback permit
}

export async function saveRsvp(client: SupabaseClient, invitationId: string, rsvp: RsvpPayload) {
  const now = new Date().toISOString();

  // Save to persistent resilient store
  resilientStore.saveRsvp({
    invitation_id: invitationId,
    attendance_status: rsvp.attendanceStatus,
    attendee_count: rsvp.attendeeCount,
    guest_names: rsvp.guestNames,
    dietary_requirements: rsvp.dietaryRequirements ?? null,
    notes: rsvp.notes ?? null,
    language: rsvp.language,
    submitted_at: now,
    updated_at: now,
  });

  try {
    await client.from("rsvps").upsert(
      {
        invitation_id: invitationId,
        attendance_status: rsvp.attendanceStatus,
        attendee_count: rsvp.attendeeCount,
        guest_names: rsvp.guestNames,
        dietary_requirements: rsvp.dietaryRequirements ?? null,
        notes: rsvp.notes ?? null,
        language: rsvp.language,
        submitted_at: now,
        updated_at: now,
      },
      { onConflict: "invitation_id" },
    );
  } catch {}
}

export async function saveSongRequests(
  client: SupabaseClient,
  invitationId: string,
  payload: SongRequestPayload,
) {
  // Save to resilient local store
  resilientStore.saveSongRequests(
    invitationId,
    payload.requests.map((r) => ({ title: r.title, artist: r.artist, spotifyUrl: r.spotifyUrl })),
  );

  if (invitationId === DEMO_INVITATION.id) return;

  const rows = payload.requests.map((request, index) => ({
    invitation_id: invitationId,
    slot: index + 1,
    song_title: request.title,
    artist: request.artist ?? null,
    spotify_url: request.spotifyUrl ?? null,
    submitted_at: new Date().toISOString(),
  }));

  try {
    if (rows.length > 0) {
      await client.from("song_requests").upsert(rows, {
        onConflict: "invitation_id,slot",
      });
    }

    for (let staleSlot = rows.length + 1; staleSlot <= 3; staleSlot += 1) {
      await client
        .from("song_requests")
        .delete()
        .eq("invitation_id", invitationId)
        .eq("slot", staleSlot);
    }
  } catch {}
}

export async function recordInvitationEvent(
  client: SupabaseClient,
  event: {
    invitationId: string;
    sessionId?: string;
    eventType: string;
    locale?: string;
  },
) {
  if (event.invitationId === DEMO_INVITATION.id) return;

  const { error } = await client.from("invitation_events").insert({
    invitation_id: event.invitationId,
    session_id: event.sessionId ?? null,
    event_type: event.eventType,
    locale: event.locale ?? null,
  });

  if (error) throw new Error("Invitation event could not be saved.");
}