import { recordAdminAudit } from "@/lib/admin/audit";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { exportAllWeddingDataAction } from "@/app/actions/admin-export";

export const dynamic = "force-dynamic";

export async function GET() {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }

  if (!actor) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  try {
    const exportData = await exportAllWeddingDataAction();
    if (!exportData.success) {
      return new Response(exportData.error || "Backup failed", { status: 500 });
    }

    const jsonContent = JSON.stringify(exportData, null, 2);
    const filename = `wedding-full-backup-schloss-hetzendorf-${new Date().toISOString().split("T")[0]}.json`;

    try {
      await recordAdminAudit({
        actor,
        action: "INVITATIONS_EXPORTED",
        resourceType: "wedding_data",
        metadata: {
          format: "json",
          invitations: exportData.counts.invitations,
          rsvps: exportData.counts.rsvps,
        },
      });
    } catch {}

    return new Response(jsonContent, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (err) {
    return new Response("Backup export is temporarily unavailable.", {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
