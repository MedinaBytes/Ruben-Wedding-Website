import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { resilientStore } from "@/lib/storage/resilient-store";
import { CheckInManager, type CheckInGuestRow } from "@/components/admin/checkin-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Door QR Check-In — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCheckInPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  const invitations = resilientStore.getInvitations();
  const rsvps = resilientStore.getRsvps();
  const checkIns = resilientStore.getCheckIns();
  const tableAssignments = resilientStore.getTableAssignments();
  const settings = resilientStore.getSettings();

  const rsvpMap = new Map(rsvps.map((r) => [r.invitation_id, r]));
  const tableMap = new Map(tableAssignments.map((t) => [t.invitation_id, t]));

  const guests: CheckInGuestRow[] = invitations
    .filter((inv) => inv.status === "active")
    .map((inv) => {
      const rsvp = rsvpMap.get(inv.id);
      const table = tableMap.get(inv.id);
      return {
        invitationId: inv.id,
        token: inv.token,
        displayName: inv.display_name,
        groupName: inv.group_name,
        maxGuests: inv.max_guests,
        attendeeCount: rsvp?.attendee_count ?? 1,
        guestNames: rsvp?.guest_names || [],
        dietary: rsvp?.dietary_requirements || null,
        notes: rsvp?.notes || null,
        tableNumber: table?.table_number || null,
        tableName: table?.table_name || null,
      };
    });

  return (
    <CheckInManager
      initialCheckIns={checkIns}
      guests={guests}
      isEnabled={settings.enableQrCheckin !== false}
    />
  );
}
