import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RsvpsManager, type RsvpRow } from "@/components/admin/rsvps-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RSVPs & Attendance — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminRsvpsPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const client = createSupabaseAdminClient();
  const [invitationsRes, rsvpsRes] = await Promise.all([
    client.from("invitations").select("id, display_name, group_name, max_guests, status"),
    client.from("rsvps").select("*"),
  ]);

  const rsvpMap = new Map((rsvpsRes.data ?? []).map((r) => [r.invitation_id, r]));

  const rsvps: RsvpRow[] = (invitationsRes.data ?? []).map((inv) => {
    const saved = rsvpMap.get(inv.id);
    return {
      invitationId: inv.id,
      displayName: inv.display_name,
      groupName: inv.group_name,
      maxGuests: inv.max_guests,
      status: (saved?.attendance_status as "yes" | "no") || "pending",
      attendeeCount: saved?.attendee_count || 0,
      guestNames: saved?.guest_names || [],
      dietaryRequirements: saved?.dietary_requirements || null,
      notes: saved?.notes || null,
      submittedAt: saved?.submitted_at || null,
    };
  });

  return <RsvpsManager rsvps={rsvps} />;
}
