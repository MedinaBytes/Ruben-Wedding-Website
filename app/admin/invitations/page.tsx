import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { InvitationsManager, type InvitationRow } from "@/components/admin/invitations-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Invitations — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminInvitationsPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const client = createSupabaseAdminClient();
  const [invitationsRes, rsvpsRes] = await Promise.all([
    client
      .from("invitations")
      .select("id, display_name, group_name, language, max_guests, plus_one_allowed, status, created_at")
      .order("created_at", { ascending: false }),
    client.from("rsvps").select("invitation_id, attendance_status, attendee_count"),
  ]);

  const rsvpMap = new Map(
    (rsvpsRes.data ?? []).map((r) => [r.invitation_id, { status: r.attendance_status, count: r.attendee_count }]),
  );

  const invitations: InvitationRow[] = (invitationsRes.data ?? []).map((inv) => {
    const rsvp = rsvpMap.get(inv.id);
    return {
      id: inv.id,
      displayName: inv.display_name,
      groupName: inv.group_name,
      language: inv.language,
      maxGuests: inv.max_guests,
      plusOneAllowed: inv.plus_one_allowed,
      status: inv.status as "active" | "draft" | "revoked",
      createdAt: inv.created_at,
      rsvpStatus: (rsvp?.status as "yes" | "no") || "pending",
      attendeeCount: rsvp?.count || 0,
    };
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return <InvitationsManager invitations={invitations} siteUrl={siteUrl} />;
}
