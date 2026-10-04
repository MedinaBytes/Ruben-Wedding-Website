"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAdminAudit } from "@/lib/admin/audit";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resilientStore } from "@/lib/storage/resilient-store";

const deleteConfirmationSchema = z.object({
  confirmation: z.literal("DELETE WEDDING DATA"),
});

export async function deleteWeddingData(formData: FormData) {
  const actor = await getAuthenticatedAdminIdentity();
  if (!actor) redirect("/admin");

  const confirmation = deleteConfirmationSchema.safeParse({
    confirmation: formData.get("confirmation"),
  });
  if (!confirmation.success) redirect("/admin?error=delete-confirmation");

  try {
    // 1. Purge local resilient storage (reset to default demo)
    resilientStore.purgeWeddingData(true);

    // 2. Also attempt remote Supabase purge if configured
    try {
      await createSupabaseAdminClient().rpc("delete_wedding_data");
    } catch {
      // Ignored if RPC doesn't exist on remote yet
    }

    await recordAdminAudit({
      actor,
      action: "WEDDING_DATA_DELETED",
      resourceType: "wedding_data",
    });
  } catch {
    redirect("/admin?error=delete");
  }

  redirect("/admin?deleted=1");
}
