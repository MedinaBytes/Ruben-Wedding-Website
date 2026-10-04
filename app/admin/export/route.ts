import { recordAdminAudit } from "@/lib/admin/audit";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const actor = await getAuthenticatedAdminIdentity();
  if (!actor) {
    return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    let remoteInvitations: Array<Record<string, unknown>> = [];
    let remoteRsvps: Array<Record<string, unknown>> = [];

    try {
      const client = createSupabaseAdminClient();
      const [invitationResult, rsvpResult] = await Promise.all([
        client.from("invitations").select("id, display_name, group_name, language, max_guests, plus_one_allowed, status").order("display_name"),
        client.from("rsvps").select("invitation_id, attendance_status, attendee_count, guest_names, dietary_requirements, submitted_at"),
      ]);
      if (invitationResult.data) remoteInvitations = invitationResult.data as Array<Record<string, unknown>>;
      if (rsvpResult.data) remoteRsvps = rsvpResult.data as Array<Record<string, unknown>>;
    } catch {}

    const { resilientStore } = await import("@/lib/storage/resilient-store");
    const localInvitations = resilientStore.getInvitations();
    const localRsvps = resilientStore.getRsvps();

    const seenIds = new Set<string>();
    const allInvitations: Array<{
      id: string;
      display_name: string;
      group_name: string | null;
      language: string | null;
      max_guests: number;
      plus_one_allowed: boolean;
      status: string;
    }> = [];

    for (const inv of localInvitations) {
      seenIds.add(inv.id);
      allInvitations.push({
        id: inv.id,
        display_name: inv.display_name,
        group_name: inv.group_name,
        language: inv.language,
        max_guests: inv.max_guests,
        plus_one_allowed: inv.plus_one_allowed,
        status: inv.status,
      });
    }

    for (const inv of remoteInvitations) {
      const id = String(inv.id);
      if (!seenIds.has(id)) {
        seenIds.add(id);
        allInvitations.push({
          id,
          display_name: String(inv.display_name || "Guest"),
          group_name: inv.group_name ? String(inv.group_name) : null,
          language: inv.language ? String(inv.language) : null,
          max_guests: Number(inv.max_guests) || 1,
          plus_one_allowed: Boolean(inv.plus_one_allowed),
          status: String(inv.status || "active"),
        });
      }
    }

    const rsvps = new Map<string, {
      attendance_status?: string | null;
      attendee_count?: number | null;
      guest_names?: string[] | null;
      dietary_requirements?: string | null;
      submitted_at?: string | null;
    }>();

    for (const r of localRsvps) {
      rsvps.set(r.invitation_id, {
        attendance_status: r.attendance_status,
        attendee_count: r.attendee_count,
        guest_names: r.guest_names,
        dietary_requirements: r.dietary_requirements,
        submitted_at: r.submitted_at,
      });
    }

    for (const r of remoteRsvps) {
      const invId = String(r.invitation_id);
      if (!rsvps.has(invId)) {
        rsvps.set(invId, {
          attendance_status: r.attendance_status ? String(r.attendance_status) : null,
          attendee_count: Number(r.attendee_count) || 0,
          guest_names: Array.isArray(r.guest_names) ? (r.guest_names as string[]) : [],
          dietary_requirements: r.dietary_requirements ? String(r.dietary_requirements) : null,
          submitted_at: r.submitted_at ? String(r.submitted_at) : null,
        });
      }
    }

    const columns = ["Invitation", "Group", "Language", "Status", "Guest places", "Plus one allowed", "RSVP", "Attendee count", "Guest names", "Dietary requirements", "Response submitted"];
    const rows = allInvitations.map((invitation) => {
      const rsvp = rsvps.get(invitation.id);
      return [
        invitation.display_name,
        invitation.group_name,
        invitation.language,
        invitation.status,
        invitation.max_guests,
        invitation.plus_one_allowed ? "Yes" : "No",
        rsvp?.attendance_status || "Pending",
        rsvp?.attendee_count || 0,
        rsvp?.guest_names?.join("; "),
        rsvp?.dietary_requirements,
        rsvp?.submitted_at,
      ];
    });
    const csv = [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

    try {
      await recordAdminAudit({
        actor,
        action: "INVITATIONS_EXPORTED",
        resourceType: "guest_export",
        metadata: { invitationCount: rows.length },
      });
    } catch {}

    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'attachment; filename="wedding-guests-2027-10-02.csv"',
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch {
    return new Response("Guest export is temporarily unavailable.", {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
