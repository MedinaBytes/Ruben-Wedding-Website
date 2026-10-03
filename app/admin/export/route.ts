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
    const client = createSupabaseAdminClient();
    const [invitationResult, rsvpResult] = await Promise.all([
      client.from("invitations").select("id, display_name, group_name, language, max_guests, plus_one_allowed, status").order("display_name"),
      client.from("rsvps").select("invitation_id, attendance_status, attendee_count, guest_names, dietary_requirements, submitted_at"),
    ]);

    if (invitationResult.error || rsvpResult.error) throw new Error("Guest export unavailable.");

    const rsvps = new Map((rsvpResult.data ?? []).map((rsvp) => [rsvp.invitation_id, rsvp]));
    const columns = ["Invitation", "Group", "Language", "Status", "Guest places", "Plus one allowed", "RSVP", "Attendee count", "Guest names", "Dietary requirements", "Response submitted"];
    const rows = (invitationResult.data ?? []).map((invitation) => {
      const rsvp = rsvps.get(invitation.id);
      return [
        invitation.display_name,
        invitation.group_name,
        invitation.language,
        invitation.status,
        invitation.max_guests,
        invitation.plus_one_allowed ? "Yes" : "No",
        rsvp?.attendance_status,
        rsvp?.attendee_count,
        rsvp?.guest_names?.join("; "),
        rsvp?.dietary_requirements,
        rsvp?.submitted_at,
      ];
    });
    const csv = [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

    await recordAdminAudit({
      actor,
      action: "INVITATIONS_EXPORTED",
      resourceType: "guest_export",
      metadata: { invitationCount: rows.length },
    });

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
