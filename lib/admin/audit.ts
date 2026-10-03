import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminAuditAction =
  | "ADMIN_SIGNED_IN"
  | "ADMIN_SIGNED_OUT"
  | "INVITATION_CREATED"
  | "INVITATION_UPDATED"
  | "INVITATION_REVOKED"
  | "INVITATIONS_EXPORTED"
  | "WEDDING_DATA_DELETED";

export async function recordAdminAudit({
  actor,
  action,
  resourceType,
  resourceId,
  metadata = {},
}: {
  actor: { id: string; email: string };
  action: AdminAuditAction;
  resourceType: "admin_session" | "invitation" | "guest_export" | "wedding_data";
  resourceId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const { error } = await createSupabaseAdminClient().from("admin_audit_log").insert({
    actor_user_id: actor.id,
    actor_email: actor.email,
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
    metadata,
  });

  if (error) throw new Error("Admin audit event could not be stored.");
}
