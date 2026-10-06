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

  // Metrics
  const totalInvitations = invitations.length;
  const activeInvitations = invitations.filter((i) => i.status === "active").length;
  const totalGuestCapacity = invitations.reduce((sum, i) => sum + (i.max_guests || 1), 0);

  // Opened invitations
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

  // Segmented RSVP percentages
  const rsvpTotalDenominator = Math.max(1, activeInvitations);
  const yesPercent = Math.round((confirmedRsvps.length / rsvpTotalDenominator) * 100);
  const noPercent = Math.round((declinedRsvps.length / rsvpTotalDenominator) * 100);
  const pendingPercent = Math.max(0, 100 - yesPercent - noPercent);

  // Songs summary
  const totalSongs = songs.length;
  const playlistSelected = songs.filter((s) => s.selected_for_playlist).length;
  const playlistPercent = totalSongs > 0 ? Math.round((playlistSelected / totalSongs) * 100) : 0;

  const settings = resilientStore.getSettings();
  const hasResend = Boolean(settings.resendApiKey || process.env.RESEND_API_KEY);
  const isDemo = resilientStore.isDemoEnabled();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Unboxed Clean Page Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-page-header__eyebrow">
            Hetzendorf Palace · Vienna 2027
          </div>
          <h1 className="admin-page-header__title">
            Dashboard &amp; Attendance Overview
          </h1>
          <p className="admin-page-header__subtitle">
            Real-time supervision of invitations, confirmed attendees, and guest music requests.
          </p>
        </div>

        {/* Integration Status Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link
            href="/admin/settings#email"
            className={`admin-status-badge ${hasResend ? "admin-status-badge--success" : "admin-status-badge--warning"}`}
          >
            <span className="admin-status-badge__dot" />
            <span>{hasResend ? "Resend Connected" : "Resend: Key Pending"}</span>
          </Link>

          <Link
            href="/admin/settings#demo"
            className="admin-status-badge admin-status-badge--info"
          >
            <span className="admin-status-badge__dot" />
            <span>{isDemo ? "Demo Mode Active" : "Production Mode"}</span>
          </Link>
        </div>
      </div>

      {/* 4 Balanced KPI Cards (Identical Height & Layout) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.25rem" }}>
        {/* Card 1: Invitaciones */}
        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-card__head">
              <span className="admin-stat-card__label">Invitation Opens</span>
              <div className="admin-stat-card__icon-badge" style={{ background: "#FDF2F4", color: "#8C2836" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </div>

            <div className="admin-stat-card__metric-row">
              <span className="admin-stat-card__value">{openRatePercent}%</span>
              <span className="admin-stat-card__unit">open rate</span>
            </div>
          </div>

          <div>
            <div className="admin-stat-card__bar-wrap">
              <div
                className="admin-stat-card__bar"
                style={{ width: `${Math.min(100, openRatePercent)}%`, background: "#8C2836" }}
              />
            </div>
            <p className="admin-stat-card__meta">
              <span>{openedCount} opened</span>
              <span>of {activeInvitations} active ({totalInvitations} total)</span>
            </p>
          </div>
        </div>

        {/* Card 2: Asistencia Confirmada */}
        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-card__head">
              <span className="admin-stat-card__label">Palace Attendance</span>
              <div className="admin-stat-card__icon-badge" style={{ background: "#F2F6F0", color: "#55644E" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <polyline points="16 11 18 13 22 9" />
                </svg>
              </div>
            </div>

            <div className="admin-stat-card__metric-row">
              <span className="admin-stat-card__value">{confirmedAttendees}</span>
              <span className="admin-stat-card__unit">/ {totalGuestCapacity} seats</span>
            </div>
          </div>

          <div>
            <div className="admin-stat-card__bar-wrap">
              <div
                className="admin-stat-card__bar"
                style={{ width: `${Math.min(100, attendanceRatePercent)}%`, background: "#55644E" }}
              />
            </div>
            <p className="admin-stat-card__meta">
              <span>{attendanceRatePercent}% of capacity</span>
              <span>{confirmedRsvps.length} confirmed</span>
            </p>
          </div>
        </div>

        {/* Card 3: Respuestas RSVP */}
        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-card__head">
              <span className="admin-stat-card__label">RSVP Response Status</span>
              <div className="admin-stat-card__icon-badge" style={{ background: "#FFF9EC", color: "#A87A26" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>

            <div className="admin-stat-card__metric-row">
              <span className="admin-stat-card__value">{pendingCount}</span>
              <span className="admin-stat-card__unit">pending replies</span>
            </div>
          </div>

          <div>
            {/* Segmented bar: Green (Yes), Burgundy (No), Amber (Pending) */}
            <div className="admin-stat-card__segmented-bar">
              <div style={{ width: `${yesPercent}%`, background: "#55644E" }} title={`${confirmedRsvps.length} Attending`} />
              <div style={{ width: `${noPercent}%`, background: "#8C2836" }} title={`${declinedRsvps.length} Declined`} />
              <div style={{ width: `${pendingPercent}%`, background: "#D8C6B6" }} title={`${pendingCount} Pending`} />
            </div>
            <p className="admin-stat-card__meta">
              <span>{confirmedRsvps.length} Attending</span>
              <span>·</span>
              <span>{declinedRsvps.length} Declined</span>
              <span>·</span>
              <span>{pendingCount} Pending</span>
            </p>
          </div>
        </div>

        {/* Card 4: Música */}
        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-card__head">
              <span className="admin-stat-card__label">Music &amp; Setlist</span>
              <div className="admin-stat-card__icon-badge" style={{ background: "#EFFBF2", color: "#1DB954" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            </div>

            <div className="admin-stat-card__metric-row">
              <span className="admin-stat-card__value">{totalSongs}</span>
              <span className="admin-stat-card__unit">suggested tracks</span>
            </div>
          </div>

          <div>
            <div className="admin-stat-card__bar-wrap">
              <div
                className="admin-stat-card__bar"
                style={{ width: `${Math.min(100, playlistPercent)}%`, background: "#1DB954" }}
              />
            </div>
            <p className="admin-stat-card__meta">
              <span>{playlistSelected} in setlist</span>
              <span>{Math.max(0, totalSongs - playlistSelected)} to review</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.3rem", margin: "0 0 1rem 0", color: "#2B2425", fontWeight: 600 }}>
          Quick Management Actions
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {/* Action 1 */}
          <div className="admin-card">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.35rem 0", color: "#2B2425", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#8C2836" }}>✉️</span>
              <span>Invitations &amp; Access Tokens</span>
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.86rem", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
              Create new guest invitations, view personalized links, and export QR codes for WhatsApp or physical stationery.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <Link
                href="/admin/invitations"
                style={{
                  background: "#8C2836",
                  color: "#FFFFFF",
                  borderRadius: "7px",
                  padding: "0.45rem 0.95rem",
                  fontSize: "0.84rem",
                  textDecoration: "none",
                  fontWeight: 600,
                  boxShadow: "0 2px 6px rgba(140, 40, 54, 0.2)",
                }}
              >
                View Invitations →
              </Link>
              <Link
                href="/admin/invitations/import"
                style={{
                  background: "#FAF7F5",
                  border: "1px solid #D8CFC8",
                  color: "#4C3F42",
                  borderRadius: "7px",
                  padding: "0.45rem 0.95rem",
                  fontSize: "0.84rem",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Import CSV
              </Link>
            </div>
          </div>

          {/* Action 2 */}
          <div className="admin-card">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.35rem 0", color: "#2B2425", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#55644E" }}>✓</span>
              <span>RSVPs &amp; Guest Dietary</span>
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.86rem", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
              Review confirmed attendee names, food allergies, dietary restrictions, and personal wishes to the couple.
            </p>
            <Link
              href="/admin/rsvps"
              style={{
                display: "inline-block",
                background: "#55644E",
                color: "#FFFFFF",
                borderRadius: "7px",
                padding: "0.45rem 0.95rem",
                fontSize: "0.84rem",
                textDecoration: "none",
                fontWeight: 600,
                boxShadow: "0 2px 6px rgba(85, 100, 78, 0.2)",
              }}
            >
              Review RSVPs →
            </Link>
          </div>

          {/* Action 3 */}
          <div className="admin-card">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.35rem 0", color: "#2B2425", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#C89D42" }}>🪑</span>
              <span>Tables &amp; Palace Seating</span>
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.86rem", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
              Organize seating arrangements at Hetzendorf Palace tables and manage family groups.
            </p>
            <Link
              href="/admin/seating"
              style={{
                display: "inline-block",
                background: "#FAF7F5",
                border: "1px solid #D8CFC8",
                color: "#4C3F42",
                borderRadius: "7px",
                padding: "0.45rem 0.95rem",
                fontSize: "0.84rem",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Manage Seating →
            </Link>
          </div>

          {/* Action 4 */}
          <div className="admin-card">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.35rem 0", color: "#2B2425", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#8C2836" }}>⚙️</span>
              <span>Settings &amp; System Config</span>
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.86rem", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
              Configure banking details, Revolut/Wise links, cash registry options, and Resend email settings.
            </p>
            <Link
              href="/admin/settings"
              style={{
                display: "inline-block",
                background: "#FAF7F5",
                border: "1px solid #D8CFC8",
                color: "#4C3F42",
                borderRadius: "7px",
                padding: "0.45rem 0.95rem",
                fontSize: "0.84rem",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              System Settings →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
