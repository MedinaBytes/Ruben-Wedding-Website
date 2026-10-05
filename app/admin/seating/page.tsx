import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
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

  const invitations = resilientStore.getInvitations();
  const rsvps = resilientStore.getRsvps();
  const assignments = resilientStore.getTableAssignments();
  const settings = resilientStore.getSettings();

  const invMap = new Map(invitations.map((i) => [i.id, i]));
  const confirmedGuests: ConfirmedGuestItem[] = [];

  for (const rsvp of rsvps) {
    if (rsvp.attendance_status === "yes") {
      const inv = invMap.get(rsvp.invitation_id);
      const displayName = inv?.display_name || "Guest";
      const cleanPrimary = displayName
        .replace(/\s*&\s*guest(\s*\(demo\))?/i, "")
        .replace(/\s*\(demo\)/i, "")
        .trim() || displayName;

      confirmedGuests.push({
        invitationId: rsvp.invitation_id,
        guestName: cleanPrimary,
        groupName: inv?.group_name,
        dietary: rsvp.dietary_requirements,
      });

      if (Array.isArray(rsvp.guest_names)) {
        for (const companion of rsvp.guest_names) {
          if (companion.trim()) {
            confirmedGuests.push({
              invitationId: rsvp.invitation_id,
              guestName: companion.trim(),
              groupName: inv?.group_name,
              dietary: rsvp.dietary_requirements,
            });
          }
        }
      }
    }
  }

  return (
    <SeatingManager
      initialAssignments={assignments}
      confirmedGuests={confirmedGuests}
      isEnabled={settings.enableTablePlanner !== false}
    />
  );
}
