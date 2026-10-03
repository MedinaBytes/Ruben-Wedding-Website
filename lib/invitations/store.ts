import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { hashInvitationToken, invitationTokenSchema } from "@/lib/invitations/token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RsvpPayload, SongRequestPayload } from "@/lib/validation/guest";

export type ActiveInvitation = {
  id: string;
  display_name: string;
  greeting_override: string | null;
  language: "en" | "es" | "de" | "hu" | null;
  max_guests: number;
  plus_one_allowed: boolean;
  personal_message: string | null;
  status: "active";
};

export function getInvitationTokenHash(token: string) {
  if (!invitationTokenSchema.safeParse(token).success) return null;
  return hashInvitationToken(token);
}

export async function findActiveInvitation(client: SupabaseClient, token: string) {
  const tokenHash = getInvitationTokenHash(token);
  if (!tokenHash) return null;

  const { data, error } = await client
    .from("invitations")
    .select("id, display_name, greeting_override, language, max_guests, plus_one_allowed, personal_message, status")
    .eq("token_hash", tokenHash)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error("Invitation lookup failed.");
  return data as ActiveInvitation | null;
}

export async function findActiveInvitationByToken(token: string) {
  const tokenHash = getInvitationTokenHash(token);
  if (!tokenHash) return null;

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("invitations")
    .select("id, display_name, greeting_override, language, max_guests, plus_one_allowed, personal_message, status")
    .eq("token_hash", tokenHash)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error("Invitation lookup failed.");
  return data as ActiveInvitation | null;
}

export async function consumeInvitationRateLimit(
  client: SupabaseClient,
  invitationId: string,
  action: "rsvp" | "songs" | "event",
  limit: number,
  windowSeconds: number,
) {
  const { data, error } = await client.rpc("consume_invitation_rate_limit", {
    p_invitation_id: invitationId,
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) throw new Error("Rate limit check failed.");
  return data === true;
}

export async function saveRsvp(client: SupabaseClient, invitationId: string, rsvp: RsvpPayload) {
  const now = new Date().toISOString();
  const { error } = await client.from("rsvps").upsert(
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

  if (error) throw new Error("RSVP could not be saved.");
}

export async function saveSongRequests(
  client: SupabaseClient,
  invitationId: string,
  payload: SongRequestPayload,
) {
  const rows = payload.requests.map((request, index) => ({
    invitation_id: invitationId,
    slot: index + 1,
    song_title: request.title,
    artist: request.artist ?? null,
    spotify_url: request.spotifyUrl ?? null,
    submitted_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    const { error } = await client.from("song_requests").upsert(rows, {
      onConflict: "invitation_id,slot",
    });
    if (error) throw new Error("Song requests could not be saved.");
  }

  for (let staleSlot = rows.length + 1; staleSlot <= 3; staleSlot += 1) {
    const { error } = await client
      .from("song_requests")
      .delete()
      .eq("invitation_id", invitationId)
      .eq("slot", staleSlot);
    if (error) throw new Error("Song requests could not be updated.");
  }
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
  const { error } = await client.from("invitation_events").insert({
    invitation_id: event.invitationId,
    session_id: event.sessionId ?? null,
    event_type: event.eventType,
    locale: event.locale ?? null,
  });

  if (error) throw new Error("Invitation event could not be saved.");
}