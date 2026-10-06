import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resilientStore } from "@/lib/storage/resilient-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard — Ruben & Andrea Wedding",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  const client = createSupabaseAdminClient();

  let remoteInvitations: Array<Record<string, unknown>> = [];
  let remoteRsvps: Array<Record<string, unknown>> = [];
  let remoteEvents: Array<Record<string, unknown>> = [];
  let remoteSongs: Array<Record<string, unknown>> = [];

  try {
    const [invitationsRes, rsvpsRes, eventsRes, songsRes] = await Promise.all([
      client.from("invitations").select("id, status, max_guests"),
      client.from("rsvps").select("id, invitation_id, attendance_status, attendee_count"),
      client.from("invitation_events").select("invitation_id, event_type"),
      client.from("song_requests").select("id, song_title, artist, selected_for_playlist"),
    ]);

    if (invitationsRes.data) remoteInvitations = invitationsRes.data as Array<Record<string, unknown>>;
    if (rsvpsRes.data) remoteRsvps = rsvpsRes.data as Array<Record<string, unknown>>;
    if (eventsRes.data) remoteEvents = eventsRes.data as Array<Record<string, unknown>>;
    if (songsRes.data) remoteSongs = songsRes.data as Array<Record<string, unknown>>;
  } catch {}

  // Merge with resilient local store
  const localInvitations = resilientStore.getInvitations();
  const localRsvps = resilientStore.getRsvps();
  const localSongs = resilientStore.getSongRequests();
  const localEvents = resilientStore.getEvents();

  // Deduplicate and combine invitations
  const invMap = new Map<string, { id: string; status: string; max_guests: number }>();
  for (const inv of localInvitations) {
    invMap.set(inv.id, { id: inv.id, status: inv.status, max_guests: inv.max_guests });
  }
  for (const inv of remoteInvitations) {
    const id = String(inv.id);
    if (!invMap.has(id)) {
      invMap.set(id, { id, status: String(inv.status || "active"), max_guests: Number(inv.max_guests) || 1 });
    }
  }
  const invitations = Array.from(invMap.values());

  // Deduplicate and combine RSVPs
  const rsvpMap = new Map<string, { attendance_status: string; attendee_count: number }>();
  for (const r of localRsvps) {
    rsvpMap.set(r.invitation_id, { attendance_status: r.attendance_status, attendee_count: r.attendee_count });
  }
  for (const r of remoteRsvps) {
    const invId = String(r.invitation_id || r.id);
    if (!rsvpMap.has(invId)) {
      rsvpMap.set(invId, { attendance_status: String(r.attendance_status), attendee_count: Number(r.attendee_count) || 0 });
    }
  }
  const rsvps = Array.from(rsvpMap.values());

  // Deduplicate and combine Songs
  const songMap = new Map<string, { id: string; selected_for_playlist: boolean }>();
  for (const s of localSongs) {
    const key = s.id || `${s.invitation_id}-${s.slot}-${s.song_title}`;
    songMap.set(key, { id: key, selected_for_playlist: Boolean(s.selected_for_playlist) });
  }
  for (const s of remoteSongs) {
    const id = String(s.id);
    if (!songMap.has(id)) {
      songMap.set(id, { id, selected_for_playlist: Boolean(s.selected_for_playlist) });
    }
  }
  const songs = Array.from(songMap.values());

  // Metrics with explicit denominators
  const totalInvitations = invitations.length;
  const activeInvitations = invitations.filter((i) => i.status === "active").length;
  const totalGuestCapacity = invitations.reduce((sum, i) => sum + (i.max_guests || 1), 0);

  // Opened invitations (count distinct invitation IDs that have an INVITE_OPENED event or RSVP submitted)
  const openedInviteIds = new Set<string>();
  for (const invId of rsvpMap.keys()) {
    openedInviteIds.add(invId);
  }
  for (const e of localEvents) {
    if (e.event_type === "INVITE_OPENED") openedInviteIds.add(e.invitation_id);
  }
  for (const e of remoteEvents) {
    if (e.event_type === "INVITE_OPENED") openedInviteIds.add(String(e.invitation_id));
  }
  const openedCount = Math.min(activeInvitations, openedInviteIds.size);
  const openRatePercent = activeInvitations > 0 ? Math.round((openedCount / activeInvitations) * 100) : 0;

  // RSVPs
  const confirmedRsvps = rsvps.filter((r) => r.attendance_status === "yes");
  const declinedRsvps = rsvps.filter((r) => r.attendance_status === "no");
  const confirmedAttendees = confirmedRsvps.reduce((sum, r) => sum + (r.attendee_count || 0), 0);
  const pendingCount = Math.max(0, activeInvitations - (confirmedRsvps.length + declinedRsvps.length));
  const attendanceRatePercent = totalGuestCapacity > 0 ? Math.round((confirmedAttendees / totalGuestCapacity) * 100) : 0;

  // Songs summary
  const totalSongs = songs.length;
  const playlistSelected = songs.filter((s) => s.selected_for_playlist).length;

  const settings = resilientStore.getSettings();
  const hasResend = Boolean(settings.resendApiKey || process.env.RESEND_API_KEY);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "0.8rem", color: "#8E696E", margin: "0 0 0.25rem 0" }}>
            Live Wedding Overview
          </p>
          <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2.2rem", margin: 0, color: "#2B2425" }}>
            Dashboard &amp; Attendance
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link
            href="/admin/settings"
            style={{
              textDecoration: "none",
              fontSize: "0.78rem",
              background: hasResend ? "#E8F5E9" : "#FFF8E1",
              color: hasResend ? "#1B5E20" : "#8D6E00",
              border: `1px solid ${hasResend ? "#C8E6C9" : "#FFE082"}`,
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: hasResend ? "#2E7D32" : "#B78103" }} />
            {hasResend ? "Resend API Connected" : "Resend API: Setup Pending"}
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
        {/* Card 1: Invitations & Open Rate */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#776A6C", margin: "0 0 0.5rem 0" }}>
            Invitations Open Rate
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "2.4rem", fontFamily: "var(--font-display, serif)", fontWeight: 700, color: "#8C2836" }}>
              {openRatePercent}%
            </span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#544648", margin: "0.4rem 0 0 0" }}>
            <strong>{openedCount}</strong> of <strong>{activeInvitations}</strong> active invitations opened ({totalInvitations} total created)
          </p>
        </div>

        {/* Card 2: Confirmed Guests vs Capacity */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#776A6C", margin: "0 0 0.5rem 0" }}>
            Guest Attendance
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "2.4rem", fontFamily: "var(--font-display, serif)", fontWeight: 700, color: "#55644E" }}>
              {confirmedAttendees}
            </span>
            <span style={{ fontSize: "1rem", color: "#776A6C" }}>/ {totalGuestCapacity} capacity</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#544648", margin: "0.4rem 0 0 0" }}>
            <strong>{attendanceRatePercent}%</strong> overall confirmation rate
          </p>
        </div>

        {/* Card 3: RSVP Status Split */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#776A6C", margin: "0 0 0.5rem 0" }}>
            RSVP Responses
          </p>
          <div style={{ display: "flex", gap: "1rem", margin: "0.5rem 0" }}>
            <div>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#55644E" }}>{confirmedRsvps.length}</span>
              <p style={{ fontSize: "0.75rem", color: "#776A6C", margin: 0 }}>Yes</p>
            </div>
            <div>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#A3434F" }}>{declinedRsvps.length}</span>
              <p style={{ fontSize: "0.75rem", color: "#776A6C", margin: 0 }}>No</p>
            </div>
            <div>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#B88636" }}>{Math.max(0, pendingCount)}</span>
              <p style={{ fontSize: "0.75rem", color: "#776A6C", margin: 0 }}>Pending</p>
            </div>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#776A6C", margin: "0.2rem 0 0 0" }}>
            Total responses: {rsvps.length} of {activeInvitations}
          </p>
        </div>

        {/* Card 4: Music Requests */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#776A6C", margin: "0 0 0.5rem 0" }}>
            Music Requests
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "2.4rem", fontFamily: "var(--font-display, serif)", fontWeight: 700, color: "#2B2425" }}>
              {totalSongs}
            </span>
            <span style={{ fontSize: "0.85rem", color: "#776A6C" }}>submitted songs</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#544648", margin: "0.4rem 0 0 0" }}>
            <strong>{playlistSelected}</strong> curated for Spotify setlist
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem" }}>
          <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.35rem", margin: "0 0 0.5rem 0", color: "#2B2425" }}>
            Guest Invitations &amp; QR Codes
          </h2>
          <p style={{ color: "#6A5D60", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            View, search, create, and revoke invitation links. Generate personalized QR codes for WhatsApp or printed envelopes.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link
              href="/admin/invitations"
              style={{
                background: "#8C2836",
                color: "#FFFFFF",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Manage Invitations →
            </Link>
            <Link
              href="/admin/invitations/import"
              style={{
                background: "transparent",
                border: "1px solid #D0C5BD",
                color: "#544648",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Bulk Import CSV
            </Link>
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem" }}>
          <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.35rem", margin: "0 0 0.5rem 0", color: "#2B2425" }}>
            RSVP Details &amp; Dietary Notes
          </h2>
          <p style={{ color: "#6A5D60", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            Review attendee names, dietary restrictions, and personal messages. Export the complete guest attendance roster to CSV.
          </p>
          <Link
            href="/admin/rsvps"
            style={{
              display: "inline-block",
              background: "#55644E",
              color: "#FFFFFF",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              fontSize: "0.85rem",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            View RSVPs &amp; Export →
          </Link>
        </div>
      </div>
    </div>
  );
}
