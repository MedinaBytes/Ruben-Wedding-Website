import Link from "next/link";

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

export async function AdminDashboard({
  labels,
  statusMessage,
  statusIsError,
  deleteAction,
}: {
  labels: Record<string, string>;
  statusMessage: string;
  statusIsError: boolean;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  let metrics: AdminMetrics;

  try {
    const client = createSupabaseAdminClient();
    const [invitationResult, rsvpResult, songResult, eventResult] = await Promise.all([
      client.from("invitations").select("id, max_guests").eq("status", "active"),
      client.from("rsvps").select("invitation_id, attendance_status, attendee_count"),
      client.from("song_requests").select("id", { count: "exact", head: true }),
      client.from("invitation_events").select("invitation_id").eq("event_type", "INVITE_OPENED"),
    ]);

    if (invitationResult.error || rsvpResult.error || songResult.error || eventResult.error) {
      throw new Error("Admin dashboard data unavailable.");
    }

    const activeInvitations = invitationResult.data ?? [];
    const activeInvitationIds = new Set(activeInvitations.map((invitation) => invitation.id));
    const activeRsvps = (rsvpResult.data ?? []).filter(
      (rsvp) => activeInvitationIds.has(rsvp.invitation_id) &&
        (rsvp.attendance_status === "yes" || rsvp.attendance_status === "no"),
    );
    const openedInvitationIds = new Set(
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
      songs: songResult.count ?? 0,
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
      <header className="admin-header">
        <div>
          <p className="section-label">{labels.label}</p>
          <h1>{labels.title}</h1>
        </div>
        <form action={signOutAdmin}>
          <button className="text-button" type="submit">{labels.signOut}</button>
        </form>
      </header>
      <nav aria-label={labels.navigation} className="admin-nav">
        <Link href="/admin">{labels.overview}</Link>
        <Link href="/admin/invitations">{labels.invitations}</Link>
        <Link href="/admin/rsvps">{labels.rsvps}</Link>
        <Link href="/admin/music">{labels.music}</Link>
        <Link href="/admin/analytics">{labels.analytics}</Link>
      </nav>
      {statusMessage && (
        <p className="admin-status" role={statusIsError ? "alert" : "status"}>
          {statusMessage}
        </p>
      )}
      <section aria-label={labels.summary} className="admin-metrics">
        {metricsList.map((metric) => (
          <article className="admin-metric" key={metric.label}>
            <h2>{metric.label}</h2>
            <p className="admin-metric__value">{metric.value}</p>
            <p className="admin-metric__note">{metric.note}</p>
          </article>
        ))}
      </section>
      <section aria-labelledby="admin-delete-title" className="admin-delete">
        <h2 id="admin-delete-title">{labels.deleteSectionTitle}</h2>
        <p id="admin-delete-warning">{labels.deleteWarning}</p>
        <form action={deleteAction} className="admin-delete__form">
          <div className="field-group">
            <label htmlFor="admin-delete-confirmation">{labels.deleteConfirmationLabel}</label>
            <input
              autoComplete="off"
              id="admin-delete-confirmation"
              name="confirmation"
              required
              type="text"
              aria-describedby="admin-delete-warning"
            />
          </div>
          <button className="text-button admin-delete__button" type="submit">
            {labels.deleteAction}
          </button>
        </form>
      </section>
    </div>
  );
}