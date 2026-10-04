import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { deleteWeddingData } from "@/app/actions/admin-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Danger Zone — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminDangerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const { error, deleted } = await searchParams;

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "0.8rem", color: "#A83232", margin: "0 0 0.25rem 0", fontWeight: 600 }}>
          High Risk Operations
        </p>
        <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
          Danger Zone
        </h1>
      </div>

      {deleted === "1" && (
        <div style={{ background: "#EEF6EC", border: "1px solid #C3E6CB", color: "#2A642D", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          ✓ All wedding records, RSVPs, song requests, and event logs have been permanently deleted.
        </div>
      )}

      {error === "delete-confirmation" && (
        <div style={{ background: "#FDF2F3", border: "1px solid #F5C6CB", color: "#8E2B38", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Confirmation text did not match exactly. Deletion aborted.
        </div>
      )}

      <div style={{ background: "#FFFFFF", border: "2px solid #F0C4C8", borderRadius: "10px", padding: "2rem" }}>
        <h2 style={{ color: "#9E2A38", fontSize: "1.3rem", marginTop: 0 }}>
          Purge All Wedding Data
        </h2>
        <p style={{ color: "#544648", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          This operation permanently deletes all invitations, attendee responses, dietary notes, song requests, and analytics logs from the Supabase database. This action is <strong>irreversible</strong>.
        </p>

        <form action={deleteWeddingData} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label htmlFor="confirmation" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.4rem" }}>
              To confirm, type <code style={{ background: "#FDF2F3", color: "#8E2B38", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>DELETE WEDDING DATA</code> below:
            </label>
            <input
              id="confirmation"
              name="confirmation"
              type="text"
              required
              autoComplete="off"
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "6px",
                border: "1px solid #D5CBC4",
                fontSize: "0.9rem",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              background: "#9E2A38",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "6px",
              padding: "0.75rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            I understand the consequences, delete all wedding data
          </button>
        </form>
      </div>
    </div>
  );
}
