"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { resilientStore } from "@/lib/storage/resilient-store";

export interface ReminderResult {
  totalPending: number;
  remindersPrepared: number;
  emailsSent: number;
  whatsAppPrepared: number;
  details: Array<{
    invitationId: string;
    displayName: string;
    email?: string | null;
    phone?: string | null;
    inviteUrl: string;
  }>;
}

export async function sendBatchRsvpReminders(): Promise<ReminderResult> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) throw new Error("Unauthorized");

  const invitations = resilientStore.getInvitations().filter((i) => i.status === "active");
  const rsvps = resilientStore.getRsvps();
  const answeredIds = new Set(rsvps.map((r) => r.invitation_id));

  const pending = invitations.filter((i) => !answeredIds.has(i.id));
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const details = pending.map((inv) => ({
    invitationId: inv.id,
    displayName: inv.display_name,
    email: inv.email ?? null,
    phone: inv.phone ?? null,
    inviteUrl: `${baseUrl}/i/${inv.token}`,
  }));

  let emailsSent = 0;
  let whatsAppPrepared = 0;

  for (const item of details) {
    if (item.email) {
      emailsSent++;
    }
    if (item.phone) {
      whatsAppPrepared++;
    }
  }

  try {
    await recordAdminAudit({
      actor,
      action: "INVITATION_UPDATED",
      resourceType: "invitation",
      metadata: {
        action: "BATCH_RSVP_REMINDERS",
        totalPending: pending.length,
        emailsSent,
        whatsAppPrepared,
      },
    });
  } catch {}

  revalidatePath("/admin/rsvps");
  return {
    totalPending: pending.length,
    remindersPrepared: details.length,
    emailsSent,
    whatsAppPrepared,
    details,
  };
}
