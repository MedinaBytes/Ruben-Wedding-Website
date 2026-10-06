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
      return new Response(exportData.error || "Export failed", { status: 500 });
    }

    const csvContent = "\uFEFF" + exportData.csv.guests;
    const filename = `wedding-guests-schloss-hetzendorf-${new Date().toISOString().split("T")[0]}.csv`;

    try {
      await recordAdminAudit({
        actor,
        action: "INVITATIONS_EXPORTED",
        resourceType: "guest_export",
        metadata: { format: "csv", count: exportData.counts.invitations },
      });
    } catch {}

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (err) {
    return new Response("Guest export is temporarily unavailable.", {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
