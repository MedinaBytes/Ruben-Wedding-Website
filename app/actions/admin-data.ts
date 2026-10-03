"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const deleteConfirmationSchema = z.object({
  confirmation: z.literal("DELETE WEDDING DATA"),
});

export async function deleteWeddingData(formData: FormData) {
  if (!(await hasAuthenticatedAdmin())) redirect("/admin");

  const confirmation = deleteConfirmationSchema.safeParse({
    confirmation: formData.get("confirmation"),
  });
  if (!confirmation.success) redirect("/admin?error=delete-confirmation");

  try {
    const { error } = await createSupabaseAdminClient().rpc("delete_wedding_data");
    if (error) throw new Error("Wedding data deletion failed.");
  } catch {
    redirect("/admin?error=delete");
  }

  redirect("/admin?deleted=1");
}