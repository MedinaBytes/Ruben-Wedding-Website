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

import { resilientStore } from "@/lib/storage/resilient-store";

export default async function AdminInvitationsPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  const client = createSupabaseAdminClient();
  let remoteInvitations: Array<Record<string, unknown>> = [];
  const rsvpMap = new Map<string, { status: string; count: number }>();

  try {
    const [invitationsRes, rsvpsRes] = await Promise.all([
      client
        .from("invitations")
        .select("id, display_name, group_name, language, max_guests, plus_one_allowed, status, created_at, email, phone, whatsapp")
        .order("created_at", { ascending: false }),
      client.from("rsvps").select("invitation_id, attendance_status, attendee_count"),
    ]);

    if (invitationsRes.data) {
      remoteInvitations = invitationsRes.data as Array<Record<string, unknown>>;
    }
    (rsvpsRes.data ?? []).forEach((r) => {
      rsvpMap.set(r.invitation_id, { status: r.attendance_status, count: r.attendee_count });
    });
  } catch {}

  // Merge with resilient local store
  const localInvitations = resilientStore.getInvitations();
  const localRsvps = resilientStore.getRsvps();
  localRsvps.forEach((r) => {
    if (!rsvpMap.has(r.invitation_id)) {
      rsvpMap.set(r.invitation_id, { status: r.attendance_status, count: r.attendee_count });
    }
  });

  const seenIds = new Set<string>();
  const combined: InvitationRow[] = [];

  const isDemoEnabled = resilientStore.isDemoEnabled();

  // Local first
  for (const inv of localInvitations) {
    if (!isDemoEnabled && (inv.id === "00000000-0000-0000-0000-000000000001" || inv.token === "demo")) {
      continue;
    }
    seenIds.add(inv.id);
    const rsvp = rsvpMap.get(inv.id);
    combined.push({
      id: inv.id,
      displayName: inv.display_name,
      groupName: inv.group_name,
      language: inv.language,
      maxGuests: inv.max_guests,
      plusOneAllowed: inv.plus_one_allowed,
      status: inv.status,
      createdAt: inv.created_at,
      rsvpStatus: (rsvp?.status as "yes" | "no") || "pending",
      attendeeCount: rsvp?.count || 0,
      email: inv.email || null,
      phone: inv.phone || null,
      whatsapp: inv.whatsapp || null,
      token: inv.id === "00000000-0000-0000-0000-000000000001" ? "demo" : (inv.token || inv.id),
    });
  }

  // Remote
  for (const inv of remoteInvitations) {
    const id = String(inv.id);
    if (!isDemoEnabled && (id === "00000000-0000-0000-0000-000000000001" || inv.token === "demo")) {
      continue;
    }
    if (!seenIds.has(id)) {
      seenIds.add(id);
      const rsvp = rsvpMap.get(id);
      combined.push({
        id,
        displayName: String(inv.display_name || ""),
        groupName: (inv.group_name as string) || null,
        language: (inv.language as string) || null,
        maxGuests: Number(inv.max_guests) || 1,
        plusOneAllowed: Boolean(inv.plus_one_allowed),
        status: (inv.status as "active" | "draft" | "revoked") || "active",
        createdAt: String(inv.created_at || new Date().toISOString()),
        rsvpStatus: (rsvp?.status as "yes" | "no") || "pending",
        attendeeCount: rsvp?.count || 0,
        email: (inv.email as string) || null,
        phone: (inv.phone as string) || null,
        whatsapp: (inv.whatsapp as string) || null,
      });
    }
  }

  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
    siteUrl = `http://${siteUrl}`;
  }

  return <InvitationsManager invitations={combined} siteUrl={siteUrl} isDemoEnabled={isDemoEnabled} />;
}
