"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { resilientStore, type StoredWish } from "@/lib/storage/resilient-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveLocale } from "@/lib/wedding-config";

export interface SubmitWishResult {
  success: boolean;
  wish?: StoredWish;
  error?: string;
}

export async function submitGuestWishAction({
  invitationId,
  guestName,
  message,
  locale = "en",
}: {
  invitationId: string;
  guestName: string;
  message: string;
  locale?: string;
}): Promise<SubmitWishResult> {
  const cleanName = guestName.trim();
  const cleanMsg = message.trim();

  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: "Please enter your name." };
  }
  if (!cleanMsg || cleanMsg.length < 3) {
    return { success: false, error: "Please write a short message or blessing for Ruben & Andrea." };
  }
  if (cleanMsg.length > 1500) {
    return { success: false, error: "Message is too long (maximum 1,500 characters)." };
  }

  const wishId = `wish-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const newWish: StoredWish = {
    id: wishId,
    invitation_id: invitationId,
    guest_name: cleanName,
    message: cleanMsg,
    locale: resolveLocale(locale) || "en",
    status: "approved",
    created_at: now,
  };

  // 1. Save to local resilient store
  resilientStore.saveWish(newWish);

  // 2. Persist to Supabase guestbook_wishes
  try {
    const client = createSupabaseAdminClient();
    await client.from("guestbook_wishes").insert({
      id: wishId,
      invitation_id: invitationId,
      guest_name: cleanName,
      message: cleanMsg,
      locale: newWish.locale,
      status: "approved",
      created_at: now,
    });
  } catch {}

  // 3. Record invitation event
  try {
    resilientStore.recordEvent({
      invitation_id: invitationId,
      event_type: "GUESTBOOK_WISH_SUBMITTED",
      locale: newWish.locale,
    });
  } catch {}

  revalidatePath(`/i/${invitationId}/invitation`);
  revalidatePath("/admin/rsvps");
  revalidatePath("/admin");

  return {
    success: true,
    wish: newWish,
  };
}

export async function deleteGuestWishAction(wishId: string): Promise<{ success: boolean; error?: string }> {
  resilientStore.deleteWish(wishId);
  try {
    const client = createSupabaseAdminClient();
    await client.from("guestbook_wishes").delete().eq("id", wishId);
  } catch {}

  revalidatePath("/admin/rsvps");
  return { success: true };
}
