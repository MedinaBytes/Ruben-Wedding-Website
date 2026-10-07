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

export const DEMO_PERSONAL_MESSAGES: Record<Locale, string> = {
  en: "We would be absolutely thrilled to celebrate this unforgettable day in Vienna with you!",
  es: "¡Nos haría una ilusión inmensa celebrar este día tan especial e inolvidable en Viena contigo!",
  "de-AT": "Wir würden uns riesig freuen, diesen unvergesslichen Tag in Wien gemeinsam mit Dir zu feiern!",
  hu: "Végtelenül boldogok lennénk, ha velünk ünnepelnéd ezt a felejthetetlen napot Bécsben!",
};

export const DEMO_INVITATION: ActiveInvitation = {
  id: "00000000-0000-0000-0000-000000000001",
  display_name: "Sarah & Guest (Demo)",
  greeting_override: null,
  language: null,
  max_guests: 2,
  plus_one_allowed: true,
  personal_message: null,
  status: "active",
};

export function getInvitationTokenHash(token: string) {
  if (!invitationTokenSchema.safeParse(token).success) return null;
  return hashInvitationToken(token);
}

export async function findActiveInvitation(client: SupabaseClient, token: string) {
  if (token === "demo" || token === DEMO_INVITATION.id) {
    if (!resilientStore.isDemoEnabled()) {
      return null;
    }
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
    meal_preferences: rsvp.mealPreferences,
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

export async function addSingleSongRequest(
  client: SupabaseClient | null,
  invitationId: string,
  song: {
    title: string;
    artist?: string | null;
    spotifyUrl?: string | null;
    trackId?: string | null;
    artworkUrl?: string | null;
  },
) {
  const localResult = resilientStore.addSongRequest(invitationId, {
    title: song.title,
    artist: song.artist,
    spotifyUrl: song.spotifyUrl,
    spotifyTrackId: song.trackId,
    albumArtworkUrl: song.artworkUrl,
  });

  if (invitationId === DEMO_INVITATION.id || !client) {
    return localResult;
  }

  try {
    const { count, error } = await client
      .from("song_requests")
      .select("id", { count: "exact", head: true })
      .eq("invitation_id", invitationId);

    if (!error && typeof count === "number" && count >= 3) {
      return { success: false, error: "maximum_reached" };
    }

    const nextSlot = (count ?? 0) + 1;
    const spotifyTrackId = song.trackId && /^[A-Za-z0-9]{22}$/.test(song.trackId) ? song.trackId : null;

    await client.from("song_requests").insert({
      invitation_id: invitationId,
      slot: nextSlot,
      song_title: song.title.slice(0, 200),
      artist: song.artist ? song.artist.slice(0, 160) : null,
      spotify_url: song.spotifyUrl ?? null,
      spotify_track_id: spotifyTrackId,
      album_artwork_url: song.artworkUrl ?? null,
      playlist_status: "added",
      submitted_at: new Date().toISOString(),
    });
  } catch {}

  return localResult;
}

export async function deleteSongRequest(
  client: SupabaseClient | null,
  invitationId: string,
  identifier: string | number,
) {
  const localDeleted = resilientStore.deleteSongRequest(invitationId, identifier);

  if (invitationId === DEMO_INVITATION.id || !client) {
    return localDeleted;
  }

  try {
    if (typeof identifier === "number") {
      await client
        .from("song_requests")
        .delete()
        .eq("invitation_id", invitationId)
        .eq("slot", identifier);
    } else {
      await client
        .from("song_requests")
        .delete()
        .eq("invitation_id", invitationId)
        .or(`id.eq.${identifier},spotify_track_id.eq.${identifier}`);
    }

    // Re-index slots in Supabase
    const { data: remaining } = await client
      .from("song_requests")
      .select("id, slot")
      .eq("invitation_id", invitationId)
      .order("slot");

    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].slot !== i + 1) {
          await client
            .from("song_requests")
            .update({ slot: i + 1 })
            .eq("id", remaining[i].id);
        }
      }
    }
  } catch {}

  return localDeleted;
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
  // Always persist locally
  resilientStore.recordEvent({
    invitation_id: event.invitationId,
    session_id: event.sessionId ?? null,
    event_type: event.eventType,
    locale: event.locale ?? null,
  });

  if (event.invitationId === DEMO_INVITATION.id) return;

  try {
    await client.from("invitation_events").insert({
      invitation_id: event.invitationId,
      session_id: event.sessionId ?? null,
      event_type: event.eventType,
      locale: event.locale ?? null,
    });
  } catch {}
}