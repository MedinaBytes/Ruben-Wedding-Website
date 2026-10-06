import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resilientStore } from "@/lib/storage/resilient-store";
import { WhatsAppManager } from "@/components/admin/whatsapp-manager";
import type { InvitationRow } from "@/components/admin/invitations-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WhatsApp Dispatch — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminWhatsAppPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  const client = createSupabaseAdminClient();
  let remoteInvitations: Array<Record<string, unknown>> = [];

  try {
    const { data } = await client
      .from("invitations")
      .select("id, display_name, group_name, language, max_guests, plus_one_allowed, status, created_at, phone, whatsapp")
      .order("created_at", { ascending: false });
    if (data) remoteInvitations = data as Array<Record<string, unknown>>;
  } catch {}

  const localInvitations = resilientStore.getInvitations();
  const seenIds = new Set<string>();
  const combined: InvitationRow[] = [];

  const isDemoEnabled = resilientStore.isDemoEnabled();

  for (const inv of localInvitations) {
    if (!isDemoEnabled && (inv.id === "00000000-0000-0000-0000-000000000001" || inv.token === "demo")) {
      continue;
    }
    seenIds.add(inv.id);
    combined.push({
      id: inv.id,
      displayName: inv.display_name,
      groupName: inv.group_name,
      language: inv.language,
      maxGuests: inv.max_guests,
      plusOneAllowed: inv.plus_one_allowed,
      status: inv.status,
      createdAt: inv.created_at,
      rsvpStatus: "pending",
      attendeeCount: 0,
      phone: inv.phone || null,
      whatsapp: inv.whatsapp || null,
      token: inv.id === "00000000-0000-0000-0000-000000000001" ? "demo" : (inv.token || inv.id),
    });
  }

  for (const inv of remoteInvitations) {
    const id = String(inv.id);
    if (!isDemoEnabled && (id === "00000000-0000-0000-0000-000000000001" || inv.token === "demo")) {
      continue;
    }
    if (!seenIds.has(id)) {
      seenIds.add(id);
      combined.push({
        id,
        displayName: String(inv.display_name || ""),
        groupName: (inv.group_name as string) || null,
        language: (inv.language as string) || null,
        maxGuests: Number(inv.max_guests) || 1,
        plusOneAllowed: Boolean(inv.plus_one_allowed),
        status: (inv.status as "active" | "draft" | "revoked") || "active",
        createdAt: String(inv.created_at || new Date().toISOString()),
        rsvpStatus: "pending",
        attendeeCount: 0,
        phone: (inv.phone as string) || null,
        whatsapp: (inv.whatsapp as string) || null,
        token: id === "00000000-0000-0000-0000-000000000001" ? "demo" : id,
      });
    }
  }

  let siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "production" ? "https://theandyrubenwedding.website" : "http://localhost:3000");

  if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
    siteUrl = `https://${siteUrl}`;
  }

  return <WhatsAppManager invitations={combined} siteUrl={siteUrl} />;
}
