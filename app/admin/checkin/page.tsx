import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resilientStore } from "@/lib/storage/resilient-store";
import { CheckInManager, type CheckInGuestRow } from "@/components/admin/checkin-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Door Check-In & Reception — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCheckInPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  const client = createSupabaseAdminClient();
  let remoteInvitations: Array<Record<string, unknown>> = [];
  let remoteRsvps: Array<Record<string, unknown>> = [];
  let remoteSettingsMap = new Map<string, unknown>();

  try {
    const [invitationsRes, rsvpsRes, settingsRes] = await Promise.all([
      client.from("invitations").select("id, token, display_name, group_name, max_guests, status"),
      client.from("rsvps").select("*"),
      client.from("site_settings").select("key, value"),
    ]);
    if (invitationsRes.data) remoteInvitations = invitationsRes.data as Array<Record<string, unknown>>;
    if (rsvpsRes.data) remoteRsvps = rsvpsRes.data as Array<Record<string, unknown>>;
    if (settingsRes.data && Array.isArray(settingsRes.data)) {
      for (const row of settingsRes.data) {
        remoteSettingsMap.set(row.key, row.value);
      }
    }
  } catch {}

  const localInvitations = resilientStore.getInvitations();
  const localRsvps = resilientStore.getRsvps();
  const checkIns = resilientStore.getCheckIns();

  let tableAssignments = resilientStore.getTableAssignments();
  const remoteAssignments = remoteSettingsMap.get("table_assignments") || remoteSettingsMap.get("tableAssignments");
  if (Array.isArray(remoteAssignments) && remoteAssignments.length > 0) {
    tableAssignments = remoteAssignments as typeof tableAssignments;
  }

  const { getSiteSettings } = await import("@/lib/settings/site-settings");
  const settings = await getSiteSettings();

  // Deduplicate and combine invitations
  const invMap = new Map<string, {
    id: string;
    token?: string;
    display_name: string;
    group_name: string | null;
    max_guests: number;
    status: string;
  }>();

  for (const inv of localInvitations) {
    invMap.set(inv.id, {
      id: inv.id,
      token: inv.token,
      display_name: inv.display_name,
      group_name: inv.group_name,
      max_guests: inv.max_guests,
      status: inv.status,
    });
  }

  for (const inv of remoteInvitations) {
    const id = String(inv.id);
    if (!invMap.has(id)) {
      invMap.set(id, {
        id,
        token: (inv.token as string) || id,
        display_name: String(inv.display_name || "Guest"),
        group_name: inv.group_name ? String(inv.group_name) : null,
        max_guests: Number(inv.max_guests) || 1,
        status: String(inv.status || "active"),
      });
    }
  }

  // Deduplicate and combine RSVPs
  const rsvpMap = new Map<string, {
    attendee_count: number;
    guest_names: string[];
    dietary_requirements: string | null;
    notes: string | null;
  }>();

  for (const r of localRsvps) {
    rsvpMap.set(r.invitation_id, {
      attendee_count: r.attendee_count,
      guest_names: r.guest_names || [],
      dietary_requirements: r.dietary_requirements || null,
      notes: r.notes || null,
    });
  }

  for (const r of remoteRsvps) {
    const invId = String(r.invitation_id);
    if (!rsvpMap.has(invId)) {
      rsvpMap.set(invId, {
        attendee_count: Number(r.attendee_count) || 0,
        guest_names: Array.isArray(r.guest_names) ? (r.guest_names as string[]) : [],
        dietary_requirements: r.dietary_requirements ? String(r.dietary_requirements) : null,
        notes: r.notes ? String(r.notes) : null,
      });
    }
  }

  const tableMap = new Map(tableAssignments.map((t) => [t.invitation_id, t]));

  const guests: CheckInGuestRow[] = Array.from(invMap.values())
    .filter((inv) => inv.status === "active")
    .map((inv) => {
      const rsvp = rsvpMap.get(inv.id);
      const table = tableMap.get(inv.id);
      return {
        invitationId: inv.id,
        token: inv.token || inv.id,
        displayName: inv.display_name,
        groupName: inv.group_name,
        maxGuests: inv.max_guests,
        attendeeCount: rsvp?.attendee_count ?? 1,
        guestNames: rsvp?.guest_names || [],
        dietary: rsvp?.dietary_requirements || null,
        notes: rsvp?.notes || null,
        tableNumber: table?.table_number ? Number(table.table_number) : null,
        tableName: table?.table_name || null,
      };
    });

  return (
    <CheckInManager
      initialCheckIns={checkIns}
      guests={guests}
      isEnabled={Boolean(settings.enableQrCheckin)}
    />
  );
}
