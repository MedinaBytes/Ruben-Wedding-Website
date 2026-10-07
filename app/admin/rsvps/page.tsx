import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resilientStore } from "@/lib/storage/resilient-store";
import { RsvpsManager, type RsvpRow } from "@/components/admin/rsvps-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RSVPs & Attendance — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminRsvpsPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  const client = createSupabaseAdminClient();
  let remoteInvitations: Array<Record<string, unknown>> = [];
  let remoteRsvps: Array<Record<string, unknown>> = [];

  try {
    const [invitationsRes, rsvpsRes] = await Promise.all([
      client.from("invitations").select("id, display_name, group_name, max_guests, status"),
      client.from("rsvps").select("*"),
    ]);
    if (invitationsRes.data) remoteInvitations = invitationsRes.data as Array<Record<string, unknown>>;
    if (rsvpsRes.data) remoteRsvps = rsvpsRes.data as Array<Record<string, unknown>>;
  } catch {}

  const localInvitations = resilientStore.getInvitations();
  const localRsvps = resilientStore.getRsvps();

  // Combine invitations (local first, then remote)
  const seenIds = new Set<string>();
  const allInvitations: Array<{ id: string; display_name: string; group_name: string | null; max_guests: number; status: string }> = [];

  for (const inv of localInvitations) {
    seenIds.add(inv.id);
    allInvitations.push({
      id: inv.id,
      display_name: inv.display_name,
      group_name: inv.group_name,
      max_guests: inv.max_guests,
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
        max_guests: Number(inv.max_guests) || 1,
        status: String(inv.status || "active"),
      });
    }
  }

  // Combine RSVPs
  const rsvpMap = new Map<string, {
    status: "yes" | "no" | "pending";
    attendeeCount: number;
    guestNames: string[];
    dietaryRequirements: string | null;
    notes: string | null;
    submittedAt: string | null;
  }>();

  for (const r of localRsvps) {
    rsvpMap.set(r.invitation_id, {
      status: r.attendance_status,
      attendeeCount: r.attendee_count,
      guestNames: r.guest_names || [],
      dietaryRequirements: r.dietary_requirements || null,
      notes: r.notes || null,
      submittedAt: r.submitted_at || null,
    });
  }

  for (const r of remoteRsvps) {
    const invId = String(r.invitation_id);
    if (!rsvpMap.has(invId)) {
      rsvpMap.set(invId, {
        status: (r.attendance_status as "yes" | "no") || "pending",
        attendeeCount: Number(r.attendee_count) || 0,
        guestNames: Array.isArray(r.guest_names) ? (r.guest_names as string[]) : [],
        dietaryRequirements: r.dietary_requirements ? String(r.dietary_requirements) : null,
        notes: r.notes ? String(r.notes) : null,
        submittedAt: r.submitted_at ? String(r.submitted_at) : null,
      });
    }
  }

  const rsvps: RsvpRow[] = allInvitations.map((inv) => {
    const saved = rsvpMap.get(inv.id);
    return {
      invitationId: inv.id,
      displayName: inv.display_name,
      groupName: inv.group_name,
      maxGuests: inv.max_guests,
      status: saved?.status || "pending",
      attendeeCount: saved?.attendeeCount || 0,
      guestNames: saved?.guestNames || [],
      dietaryRequirements: saved?.dietaryRequirements || null,
      notes: saved?.notes || null,
      submittedAt: saved?.submittedAt || null,
    };
  });

  const cateringSummary = resilientStore.getCateringSummary();
  const { getSiteSettings } = await import("@/lib/settings/site-settings");
  const settings = await getSiteSettings();

  return (
    <RsvpsManager
      rsvps={rsvps}
      cateringSummary={cateringSummary}
      enableMealSelection={settings.enableMealSelection !== false}
      enableRsvpReminders={settings.enableRsvpReminders !== false}
    />
  );
}
