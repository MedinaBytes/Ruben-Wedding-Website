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

  // Songs summary
  const totalSongs = songs.length;
  const playlistSelected = songs.filter((s) => s.selected_for_playlist).length;

  const settings = resilientStore.getSettings();
  const hasResend = Boolean(settings.resendApiKey || process.env.RESEND_API_KEY);
  const isDemo = resilientStore.isDemoEnabled();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Top Hero Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #FFFFFF 0%, #FAF6F3 100%)",
          border: "1px solid #EAE1D9",
          borderRadius: "14px",
          padding: "1.75rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
          boxShadow: "0 2px 10px rgba(45, 25, 30, 0.03)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "#8C2836" }}>
              Panel General de Control
            </span>
            <span style={{ color: "#D1C4C7" }}>·</span>
            <span style={{ fontSize: "0.78rem", color: "#6A5D60" }}>
              Palacio Hetzendorf · 2 de Octubre, 2027
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "2.1rem", margin: 0, color: "#2B2425", fontWeight: 600 }}>
            Ruben &amp; Andrea — Boda en Viena
          </h1>
          <p style={{ margin: "0.35rem 0 0 0", color: "#6B5E60", fontSize: "0.92rem" }}>
            Monitor en vivo de invitaciones, confirmación de asistencia, música y servicios de boda.
          </p>
        </div>

        {/* Integration Status Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link
            href="/admin/settings#email"
            style={{
              textDecoration: "none",
              fontSize: "0.76rem",
              background: hasResend ? "#EBF5EA" : "#FFF8E6",
              color: hasResend ? "#245A22" : "#8A6200",
              border: `1px solid ${hasResend ? "#CCE5C8" : "#FFE7A3"}`,
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: hasResend ? "#2E7D32" : "#B78103" }} />
            {hasResend ? "Resend API: Conectado" : "Resend: Requiere Clave"}
          </Link>

          <Link
            href="/admin/settings#demo"
            style={{
              textDecoration: "none",
              fontSize: "0.76rem",
              background: isDemo ? "#F0F4FA" : "#F7F3EF",
              color: isDemo ? "#2A5298" : "#6E6264",
              border: `1px solid ${isDemo ? "#D3DFEE" : "#E5DDD6"}`,
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: isDemo ? "#3B6FB6" : "#9E9093" }} />
            {isDemo ? "Modo Demo Activo" : "Modo Producción"}
          </Link>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.25rem" }}>
        {/* Card 1: Invitaciones & Open Rate */}
        <div className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8A7E80", fontWeight: 700 }}>
              Apertura de Invitaciones
            </span>
            <span style={{ color: "#8C2836" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "2.4rem", fontFamily: "var(--font-display, Georgia, serif)", fontWeight: 700, color: "#8C2836", lineHeight: 1 }}>
              {openRatePercent}%
            </span>
            <span style={{ fontSize: "0.85rem", color: "#776A6C" }}>tasa de apertura</span>
          </div>

          {/* Progress bar */}
          <div style={{ height: "6px", background: "#F2ECE7", borderRadius: "999px", overflow: "hidden", marginBottom: "0.6rem" }}>
            <div style={{ width: `${Math.min(100, openRatePercent)}%`, height: "100%", background: "#8C2836", borderRadius: "999px" }} />
          </div>

          <p style={{ fontSize: "0.82rem", color: "#544648", margin: 0, lineHeight: 1.4 }}>
            <strong>{openedCount}</strong> abiertas de <strong>{activeInvitations}</strong> invitaciones activas ({totalInvitations} registradas)
          </p>
        </div>

        {/* Card 2: Asistencia Confirmada */}
        <div className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8A7E80", fontWeight: 700 }}>
              Asistencia al Palacio
            </span>
            <span style={{ color: "#55644E" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "2.4rem", fontFamily: "var(--font-display, Georgia, serif)", fontWeight: 700, color: "#55644E", lineHeight: 1 }}>
              {confirmedAttendees}
            </span>
            <span style={{ fontSize: "0.95rem", color: "#776A6C" }}>/ {totalGuestCapacity} plazas</span>
          </div>

          <div style={{ height: "6px", background: "#F2ECE7", borderRadius: "999px", overflow: "hidden", marginBottom: "0.6rem" }}>
            <div style={{ width: `${Math.min(100, attendanceRatePercent)}%`, height: "100%", background: "#55644E", borderRadius: "999px" }} />
          </div>

          <p style={{ fontSize: "0.82rem", color: "#544648", margin: 0, lineHeight: 1.4 }}>
            <strong>{attendanceRatePercent}%</strong> del aforo imperial confirmado
          </p>
        </div>

        {/* Card 3: Respuestas RSVP */}
        <div className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8A7E80", fontWeight: 700 }}>
              Estado de Respuestas RSVP
            </span>
            <span style={{ color: "#B88636" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", margin: "0.6rem 0 0.8rem" }}>
            <div style={{ background: "#FAF8F6", padding: "0.5rem", borderRadius: "6px", textAlign: "center", border: "1px solid #ECE4DD" }}>
              <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "#55644E", display: "block" }}>{confirmedRsvps.length}</span>
              <span style={{ fontSize: "0.72rem", color: "#6E6264", fontWeight: 600 }}>Sí asisten</span>
            </div>
            <div style={{ background: "#FAF8F6", padding: "0.5rem", borderRadius: "6px", textAlign: "center", border: "1px solid #ECE4DD" }}>
              <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "#8C2836", display: "block" }}>{declinedRsvps.length}</span>
              <span style={{ fontSize: "0.72rem", color: "#6E6264", fontWeight: 600 }}>No asisten</span>
            </div>
            <div style={{ background: "#FAF8F6", padding: "0.5rem", borderRadius: "6px", textAlign: "center", border: "1px solid #ECE4DD" }}>
              <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "#A87A26", display: "block" }}>{pendingCount}</span>
              <span style={{ fontSize: "0.72rem", color: "#6E6264", fontWeight: 600 }}>Pendientes</span>
            </div>
          </div>

          <p style={{ fontSize: "0.82rem", color: "#776A6C", margin: 0 }}>
            {rsvps.length} respuestas de {activeInvitations} familias
          </p>
        </div>

        {/* Card 4: Canciones de Fiesta */}
        <div className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8A7E80", fontWeight: 700 }}>
              Música &amp; Playlist
            </span>
            <span style={{ color: "#1DB954" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "2.4rem", fontFamily: "var(--font-display, Georgia, serif)", fontWeight: 700, color: "#2B2425", lineHeight: 1 }}>
              {totalSongs}
            </span>
            <span style={{ fontSize: "0.85rem", color: "#776A6C" }}>canciones sugeridas</span>
          </div>

          <div style={{ height: "6px", background: "#F2ECE7", borderRadius: "999px", overflow: "hidden", marginBottom: "0.6rem" }}>
            <div style={{ width: `${Math.min(100, totalSongs > 0 ? (playlistSelected / totalSongs) * 100 : 0)}%`, height: "100%", background: "#1DB954", borderRadius: "999px" }} />
          </div>

          <p style={{ fontSize: "0.82rem", color: "#544648", margin: 0, lineHeight: 1.4 }}>
            <strong>{playlistSelected}</strong> aprobadas para el setlist oficial del DJ
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.35rem", margin: "0 0 1rem 0", color: "#2B2425", fontWeight: 600 }}>
          Accesos Rápidos de Gestión
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "1.25rem" }}>
          {/* Action 1 */}
          <div className="admin-card">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.35rem 0", color: "#2B2425", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#8C2836" }}>✉️</span>
              <span>Invitaciones &amp; Enlaces Únicos</span>
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.86rem", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
              Crea nuevas invitaciones, visualiza los enlaces personalizados y exporta códigos para WhatsApp o tarjetas impresas.
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
                Ver Invitaciones →
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
                Importar CSV
              </Link>
            </div>
          </div>

          {/* Action 2 */}
          <div className="admin-card">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.35rem 0", color: "#2B2425", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#55644E" }}>✓</span>
              <span>RSVPs &amp; Dietas Especiales</span>
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.86rem", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
              Revisa los nombres de asistentes, alergias alimentarias, opciones de menú y comentarios de los invitados.
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
              Consultar RSVPs →
            </Link>
          </div>

          {/* Action 3 */}
          <div className="admin-card">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.35rem 0", color: "#2B2425", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#C89D42" }}>🪑</span>
              <span>Mesas &amp; Distribución Salón</span>
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.86rem", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
              Organiza los asientos en las mesas del Palacio Hetzendorf y gestiona los grupos de invitados.
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
              Gestionar Mesas →
            </Link>
          </div>

          {/* Action 4 */}
          <div className="admin-card">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.35rem 0", color: "#2B2425", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#8C2836" }}>⚙️</span>
              <span>Ajustes &amp; Medios de Pago</span>
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.86rem", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
              Configura tus cuentas bancarias, enlaces de Revolut y Wise, buzón nupcial de efectivo y motor de email Resend.
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
              Configurar Sistema →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
