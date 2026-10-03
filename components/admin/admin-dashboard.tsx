import { signOutAdmin } from "@/app/actions/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminMetrics = {
  invitations: number;
  guests: number;
  opened: number;
  attending: number;
  declined: number;
  pending: number;
  confirmedGuests: number;
  songs: number;
};

type AdminInvitation = {
  id: string;
  display_name: string;
  group_name: string | null;
  language: string | null;
  max_guests: number;
  status: string;
};

type AdminRsvp = {
  invitation_id: string;
  attendance_status: string;
  attendee_count: number;
  guest_names: string[];
  submitted_at: string;
};

type AdminSong = {
  id: string;
  invitation_id: string;
  song_title: string;
  artist: string | null;
  submitted_at: string;
};

export async function AdminDashboard({
  labels,
  dateLocale,
  statusMessage,
  statusIsError,
  deleteAction,
}: {
  labels: Record<string, string>;
  dateLocale: string;
  statusMessage: string;
  statusIsError: boolean;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  let metrics: AdminMetrics;
  let invitations: AdminInvitation[];
  let rsvps: AdminRsvp[];
  let songs: AdminSong[];
  let openedInvitationIds: Set<string>;

  try {
    const client = createSupabaseAdminClient();
    const [invitationResult, rsvpResult, songResult, eventResult] = await Promise.all([
      client.from("invitations").select("id, display_name, group_name, language, max_guests, status").order("created_at", { ascending: false }),
      client.from("rsvps").select("invitation_id, attendance_status, attendee_count, guest_names, submitted_at").order("submitted_at", { ascending: false }),
      client.from("song_requests").select("id, invitation_id, song_title, artist, submitted_at").order("submitted_at", { ascending: false }),
      client.from("invitation_events").select("invitation_id").eq("event_type", "INVITE_OPENED"),
    ]);

    if (invitationResult.error || rsvpResult.error || songResult.error || eventResult.error) {
      throw new Error("Admin dashboard data unavailable.");
    }

    const activeInvitations = (invitationResult.data ?? []).filter((invitation) => invitation.status === "active");
    invitations = activeInvitations as AdminInvitation[];
    const activeInvitationIds = new Set(activeInvitations.map((invitation) => invitation.id));
    rsvps = ((rsvpResult.data ?? []) as AdminRsvp[]).filter((rsvp) => activeInvitationIds.has(rsvp.invitation_id));
    songs = ((songResult.data ?? []) as AdminSong[]).filter((song) => activeInvitationIds.has(song.invitation_id));
    const activeRsvps = rsvps.filter(
      (rsvp) => activeInvitationIds.has(rsvp.invitation_id) &&
        (rsvp.attendance_status === "yes" || rsvp.attendance_status === "no"),
    );
    openedInvitationIds = new Set(
      (eventResult.data ?? []).map((event) => event.invitation_id).filter((id) => activeInvitationIds.has(id)),
    );

    metrics = {
      invitations: activeInvitations.length,
      guests: activeInvitations.reduce((total, invitation) => total + invitation.max_guests, 0),
      opened: openedInvitationIds.size,
      attending: activeRsvps.filter((rsvp) => rsvp.attendance_status === "yes").length,
      declined: activeRsvps.filter((rsvp) => rsvp.attendance_status === "no").length,
      pending: Math.max(0, activeInvitations.length - activeRsvps.length),
      confirmedGuests: activeRsvps
        .filter((rsvp) => rsvp.attendance_status === "yes")
        .reduce((total, rsvp) => total + rsvp.attendee_count, 0),
      songs: songs.length,
    };
  } catch {
    return <p className="admin-status" role="status">{labels.dataUnavailable}</p>;
  }

  const metricsList = [
    { label: labels.invitationCount, value: metrics.invitations, note: labels.invitationDenominator },
    { label: labels.guestCount, value: metrics.guests, note: labels.guestDenominator },
    { label: labels.openedCount, value: metrics.opened, note: labels.openedDenominator.replace("{count}", String(metrics.invitations)) },
    { label: labels.attendingCount, value: metrics.attending, note: labels.attendanceResponses },
    { label: labels.declinedCount, value: metrics.declined, note: labels.attendanceResponses },
    { label: labels.pendingCount, value: metrics.pending, note: labels.pendingDenominator },
    { label: labels.confirmedGuests, value: metrics.confirmedGuests, note: labels.confirmedGuestsNote },
    { label: labels.songCount, value: metrics.songs, note: labels.songRequestsNote },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/admin"><span>R <i>&</i> A</span><small>{labels.label}</small></a>
        <nav aria-label={labels.navigation} className="admin-nav">
          <a className="is-current" href="#overview"><span aria-hidden="true">◫</span>{labels.overview}</a>
          <a href="#invitations"><span aria-hidden="true">✉</span>{labels.invitations}</a>
          <a href="#rsvps"><span aria-hidden="true">✓</span>{labels.rsvps}</a>
          <a href="#music"><span aria-hidden="true">♫</span>{labels.music}</a>
          <a href="#activity"><span aria-hidden="true">◷</span>{labels.analytics}</a>
        </nav>
        <div className="admin-sidebar__footer">
          <p>02 · 10 · 2027</p>
          <form action={signOutAdmin}>
            <button className="text-button" type="submit">{labels.signOut}</button>
          </form>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-header" id="overview">
          <div>
            <p className="section-label">{labels.label}</p>
            <h1>{labels.title}</h1>
          </div>
          <div className="admin-header__actions">
            <a aria-label={labels.exportCsv} className="admin-export" href="/admin/export">{labels.exportCsv}<span aria-hidden="true">↗</span></a>
            <form action={signOutAdmin}><button className="admin-signout" type="submit">{labels.signOut}</button></form>
          </div>
        </header>
        {statusMessage && <p className="admin-status" role={statusIsError ? "alert" : "status"}>{statusMessage}</p>}
        <section aria-label={labels.summary} className="admin-metrics">
          {metricsList.map((metric, index) => (
            <article className="admin-metric" key={metric.label}>
              <span className="admin-metric__index">0{index + 1}</span>
              <h2>{metric.label}</h2>
              <p className="admin-metric__value">{metric.value}</p>
              <p className="admin-metric__note">{metric.note}</p>
            </article>
          ))}
        </section>
        <div className="admin-data-grid">
          <section aria-labelledby="admin-invitations-title" className="admin-panel" id="invitations">
            <div className="admin-panel__heading"><div><p className="section-label">01 / {labels.invitations}</p><h2 id="admin-invitations-title">{labels.invitationList}</h2></div><span>{invitations.length}</span></div>
            {invitations.length ? (
              <div className="admin-table-wrap"><table><thead><tr><th>{labels.invitationName}</th><th>{labels.guestPlaces}</th><th>{labels.response}</th></tr></thead><tbody>
                {invitations.map((invitation) => {
                  const rsvp = rsvps.find((entry) => entry.invitation_id === invitation.id);
                  const status = rsvp ? (rsvp.attendance_status === "yes" ? labels.attending : labels.declined) : labels.pending;
                  return <tr key={invitation.id}><th scope="row">{invitation.display_name}<small>{invitation.group_name || invitation.language?.toUpperCase() || "—"}</small></th><td>{invitation.max_guests}</td><td><span className={`admin-status-pill admin-status-pill--${rsvp?.attendance_status ?? "pending"}`}>{status}</span></td></tr>;
                })}
              </tbody></table></div>
            ) : <p className="admin-empty">{labels.noInvitations}</p>}
          </section>
          <section aria-labelledby="admin-music-title" className="admin-panel" id="music">
            <div className="admin-panel__heading"><div><p className="section-label">02 / {labels.music}</p><h2 id="admin-music-title">{labels.songRequests}</h2></div><span>{songs.length}</span></div>
            {songs.length ? <ul className="admin-song-list">{songs.slice(0, 6).map((song) => {
              const invitation = invitations.find((entry) => entry.id === song.invitation_id);
              return <li key={song.id}><span className="admin-song-list__note" aria-hidden="true">♫</span><div><strong>{song.song_title}</strong><p>{song.artist || labels.artistUnknown} · {invitation?.display_name || "—"}</p></div></li>;
            })}</ul> : <p className="admin-empty">{labels.noSongs}</p>}
          </section>
          <section aria-labelledby="admin-rsvps-title" className="admin-panel admin-panel--wide" id="rsvps">
            <div className="admin-panel__heading"><div><p className="section-label">03 / {labels.rsvps}</p><h2 id="admin-rsvps-title">{labels.responseDetails}</h2></div><span>{rsvps.length}</span></div>
            {rsvps.length ? <div className="admin-table-wrap"><table><thead><tr><th>{labels.invitationName}</th><th>{labels.response}</th><th>{labels.confirmedGuests}</th><th>{labels.guestNames}</th></tr></thead><tbody>
              {rsvps.map((rsvp) => <tr key={rsvp.invitation_id}><th scope="row">{invitations.find((entry) => entry.id === rsvp.invitation_id)?.display_name || "—"}<small>{new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeZone: "Europe/Vienna" }).format(new Date(rsvp.submitted_at))}</small></th><td>{rsvp.attendance_status === "yes" ? labels.attending : labels.declined}</td><td>{rsvp.attendee_count}</td><td>{rsvp.guest_names.length ? rsvp.guest_names.join(", ") : "—"}</td></tr>)}
            </tbody></table></div> : <p className="admin-empty">{labels.noRsvps}</p>}
          </section>
          <section aria-labelledby="admin-activity-title" className="admin-panel" id="activity">
            <div className="admin-panel__heading"><div><p className="section-label">04 / {labels.analytics}</p><h2 id="admin-activity-title">{labels.openedCount}</h2></div></div>
            <p className="admin-activity__number">{openedInvitationIds.size}<span> / {invitations.length}</span></p>
            <p className="admin-activity__note">{labels.openedDenominator.replace("{count}", String(invitations.length))}</p>
          </section>
        </div>
        <section aria-labelledby="admin-delete-title" className="admin-delete">
          <h2 id="admin-delete-title">{labels.deleteSectionTitle}</h2>
          <p id="admin-delete-warning">{labels.deleteWarning}</p>
          <form action={deleteAction} className="admin-delete__form">
            <div className="field-group"><label htmlFor="admin-delete-confirmation">{labels.deleteConfirmationLabel}</label><input autoComplete="off" id="admin-delete-confirmation" name="confirmation" required type="text" aria-describedby="admin-delete-warning" /></div>
            <button className="text-button admin-delete__button" type="submit">{labels.deleteAction}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
