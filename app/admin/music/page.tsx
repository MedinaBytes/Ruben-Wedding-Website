import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MusicManager, type SongRequestItem } from "@/components/admin/music-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Music Requests — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminMusicPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const client = createSupabaseAdminClient();
  const [songsRes, invitationsRes] = await Promise.all([
    client.from("song_requests").select("*").order("submitted_at", { ascending: false }),
    client.from("invitations").select("id, display_name"),
  ]);

  const nameMap = new Map((invitationsRes.data ?? []).map((i) => [i.id, i.display_name]));

  const songs: SongRequestItem[] = (songsRes.data ?? []).map((s) => ({
    id: s.id,
    songTitle: s.song_title,
    artist: s.artist,
    spotifyUrl: s.spotify_url,
    selectedForPlaylist: Boolean(s.selected_for_playlist),
    guestName: nameMap.get(s.invitation_id) || "Guest",
    submittedAt: s.submitted_at,
  }));

  return <MusicManager songs={songs} />;
}
