"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { resilientStore, type StoredCheckIn } from "@/lib/storage/resilient-store";

export async function checkInGuestAction(data: {
  invitationId: string;
  guestCount?: number;
  notes?: string;
}): Promise<StoredCheckIn> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) throw new Error("Unauthorized");

  const checkIn = resilientStore.recordCheckIn(data.invitationId, data.guestCount, data.notes);

  try {
    await recordAdminAudit({
      actor,
      action: "INVITATION_UPDATED",
      resourceType: "invitation",
      metadata: { action: "GUEST_CHECKED_IN", invitationId: data.invitationId, guestCount: data.guestCount ?? 1 },
    });
  } catch {}

  revalidatePath("/admin/checkin");
  return checkIn;
}

export async function removeCheckInAction(id: string) {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) throw new Error("Unauthorized");

  resilientStore.removeCheckIn(id);

  try {
    await recordAdminAudit({
      actor,
      action: "INVITATION_UPDATED",
      resourceType: "invitation",
      metadata: { action: "CHECKIN_REVOKED", checkInId: id },
    });
  } catch {}

  revalidatePath("/admin/checkin");
  return { success: true };
}
