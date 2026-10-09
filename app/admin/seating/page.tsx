import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resilientStore } from "@/lib/storage/resilient-store";
import { SeatingManager, type ConfirmedGuestItem } from "@/components/admin/seating-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Table Seating Planner — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSeatingPage() {
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
      client.from("invitations").select("id, display_name, group_name, max_guests, status"),
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

  // Sync remote RSVPs into local resilient store so offline cache / catering stays updated
  if (remoteRsvps.length > 0) {
    const formattedRsvps = remoteRsvps.map((r) => ({
      invitation_id: String(r.invitation_id),
      attendance_status: (r.attendance_status as "yes" | "no") || "pending",
      attendee_count: Number(r.attendee_count) || 0,
      guest_names: Array.isArray(r.guest_names) ? (r.guest_names as string[]) : [],
      dietary_requirements: r.dietary_requirements ? String(r.dietary_requirements) : null,
      notes: r.notes ? String(r.notes) : null,
      language: String(r.language || "es"),
      submitted_at: String(r.submitted_at || new Date().toISOString()),
      updated_at: String(r.updated_at || new Date().toISOString()),
    }));
    resilientStore.upsertRsvps(formattedRsvps);
  }

  const localInvitations = resilientStore.getInvitations();
  const localRsvps = resilientStore.getRsvps();

  // Deduplicate and combine invitations
  const invMap = new Map<string, { id: string; display_name: string; group_name: string | null }>();
  for (const inv of localInvitations) {
    invMap.set(inv.id, { id: inv.id, display_name: inv.display_name, group_name: inv.group_name });
  }
  for (const inv of remoteInvitations) {
    const id = String(inv.id);
    if (!invMap.has(id)) {
      invMap.set(id, {
        id,
        display_name: String(inv.display_name || "Guest"),
        group_name: inv.group_name ? String(inv.group_name) : null,
      });
    }
  }

  // Deduplicate and combine RSVPs
  const rsvpMap = new Map<string, {
    attendance_status: string;
    attendee_count: number;
    guest_names: string[];
    dietary_requirements: string | null;
  }>();

  for (const r of localRsvps) {
    rsvpMap.set(r.invitation_id, {
      attendance_status: r.attendance_status,
      attendee_count: r.attendee_count,
      guest_names: r.guest_names || [],
      dietary_requirements: r.dietary_requirements || null,
    });
  }

  for (const r of remoteRsvps) {
    const invId = String(r.invitation_id);
    if (!rsvpMap.has(invId)) {
      rsvpMap.set(invId, {
        attendance_status: String(r.attendance_status),
        attendee_count: Number(r.attendee_count) || 0,
        guest_names: Array.isArray(r.guest_names) ? (r.guest_names as string[]) : [],
        dietary_requirements: r.dietary_requirements ? String(r.dietary_requirements) : null,
      });
    }
  }

  // Retrieve table assignments & definitions: Supabase site_settings priority with local fallback
  let assignments = resilientStore.getTableAssignments();
  const remoteAssignments = remoteSettingsMap.get("table_assignments") || remoteSettingsMap.get("tableAssignments");
  if (Array.isArray(remoteAssignments) && remoteAssignments.length > 0) {
    assignments = remoteAssignments as typeof assignments;
  }

  let tables = resilientStore.getTables();
  const remoteTables = remoteSettingsMap.get("table_definitions") || remoteSettingsMap.get("tables");
  if (Array.isArray(remoteTables) && remoteTables.length > 0) {
    tables = remoteTables as typeof tables;
  }

  const { getSiteSettings } = await import("@/lib/settings/site-settings");
  const settings = await getSiteSettings();

  const confirmedGuests: ConfirmedGuestItem[] = [];

  for (const [invitationId, rsvp] of rsvpMap.entries()) {
    if (rsvp.attendance_status === "yes") {
      const inv = invMap.get(invitationId);
      const rawDisplayName = inv?.display_name || "Guest";

      // If displayName is "Person A & Person B" and companion list is provided, cleanly split
      let cleanPrimary = rawDisplayName
        .replace(/\s*&\s*guest(\s*\(demo\))?/i, "")
        .replace(/\s*\(demo\)/i, "")
        .trim() || rawDisplayName;

      const companions = Array.isArray(rsvp.guest_names) ? rsvp.guest_names.map((c) => c.trim()).filter(Boolean) : [];

      if (cleanPrimary.includes(" & ") && companions.length > 0) {
        const parts = cleanPrimary.split(/\s*&\s*/);
        if (parts[0] && companions.some((c) => parts.slice(1).some((p) => p.toLowerCase() === c.toLowerCase()))) {
          cleanPrimary = parts[0].trim();
        }
      }

      confirmedGuests.push({
        invitationId,
        guestName: cleanPrimary,
        groupName: inv?.group_name,
        dietary: rsvp.dietary_requirements,
      });

      for (const companion of companions) {
        if (companion.toLowerCase() !== cleanPrimary.toLowerCase()) {
          confirmedGuests.push({
            invitationId,
            guestName: companion,
            groupName: inv?.group_name,
            dietary: rsvp.dietary_requirements,
          });
        }
      }
    }
  }

  return (
    <SeatingManager
      initialAssignments={assignments}
      initialTables={tables}
      confirmedGuests={confirmedGuests}
      isEnabled={settings.enableTablePlanner !== false}
    />
  );
}
