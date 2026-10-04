import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resilientStore } from "@/lib/storage/resilient-store";
import { MusicManager, type SongRequestItem } from "@/components/admin/music-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Music Requests — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminMusicPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  const client = createSupabaseAdminClient();
  let remoteSongs: Array<Record<string, unknown>> = [];
  let remoteInvitations: Array<Record<string, unknown>> = [];

  try {
    const [songsRes, invitationsRes] = await Promise.all([
      client.from("song_requests").select("*").order("submitted_at", { ascending: false }),
      client.from("invitations").select("id, display_name"),
    ]);
    if (songsRes.data) remoteSongs = songsRes.data as Array<Record<string, unknown>>;
    if (invitationsRes.data) remoteInvitations = invitationsRes.data as Array<Record<string, unknown>>;
  } catch {}

  const localSongs = resilientStore.getSongRequests();
  const localInvitations = resilientStore.getInvitations();

  const nameMap = new Map<string, string>();
  for (const inv of localInvitations) {
    nameMap.set(inv.id, inv.display_name);
  }
  for (const inv of remoteInvitations) {
    const id = String(inv.id);
    if (!nameMap.has(id)) {
      nameMap.set(id, String(inv.display_name || "Guest"));
    }
  }

  const seenSongKeys = new Set<string>();
  const songs: SongRequestItem[] = [];

  // Local songs first
  for (const s of localSongs) {
    const id = s.id || `song-${s.invitation_id}-${s.slot}`;
    const dedupeKey = `${s.invitation_id}-${s.song_title.toLowerCase()}`;
    seenSongKeys.add(dedupeKey);
    songs.push({
      id,
      songTitle: s.song_title,
      artist: s.artist,
      spotifyUrl: s.spotify_url,
      selectedForPlaylist: Boolean(s.selected_for_playlist),
      guestName: nameMap.get(s.invitation_id) || "Guest",
      submittedAt: s.submitted_at,
    });
  }

  // Remote songs
  for (const s of remoteSongs) {
    const invId = String(s.invitation_id);
    const title = String(s.song_title || "");
    const dedupeKey = `${invId}-${title.toLowerCase()}`;
    if (!seenSongKeys.has(dedupeKey)) {
      seenSongKeys.add(dedupeKey);
      songs.push({
        id: String(s.id),
        songTitle: title,
        artist: s.artist ? String(s.artist) : null,
        spotifyUrl: s.spotify_url ? String(s.spotify_url) : null,
        selectedForPlaylist: Boolean(s.selected_for_playlist),
        guestName: nameMap.get(invId) || "Guest",
        submittedAt: String(s.submitted_at || new Date().toISOString()),
      });
    }
  }

  return <MusicManager songs={songs} />;
}
