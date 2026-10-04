import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateSiteSettings } from "@/app/actions/admin-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Site Settings — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const client = createSupabaseAdminClient();
  const { data } = await client.from("site_settings").select("*");

  const settingsMap = new Map((data ?? []).map((s) => [s.key, s.value]));

  const showGiftDetails = Boolean(settingsMap.get("showGiftDetails"));
  const showPrivateAddress = Boolean(settingsMap.get("showPrivateAddress"));
  const spotifyPlaylistUrl = String(settingsMap.get("spotifyPlaylistUrl") || process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL || "");
  const contactPhone = String(settingsMap.get("contactPhone") || "");
  const contactEmail = String(settingsMap.get("contactEmail") || "");

  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
          Wedding Website Settings
        </h1>
        <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.9rem" }}>
          Control public visibility flags, gift disclosures, and contact recommendations.
        </p>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "2rem" }}>
        <form action={updateSiteSettings} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Toggle 1: Gift Details */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <input
              id="showGiftDetails"
              name="showGiftDetails"
              type="checkbox"
              defaultChecked={showGiftDetails}
              style={{ width: "20px", height: "20px", marginTop: "0.2rem", cursor: "pointer" }}
            />
            <div>
              <label htmlFor="showGiftDetails" style={{ display: "block", fontWeight: 600, color: "#2B2425", fontSize: "0.95rem", cursor: "pointer" }}>
                Show Gift Details / Bank Info Accordion
              </label>
              <p style={{ margin: "0.25rem 0 0 0", color: "#6E6264", fontSize: "0.85rem", lineHeight: 1.5 }}>
                When enabled, guests can expand the gift details section to see bank transfer or registry information. When disabled, only the humorous &ldquo;no toaster&rdquo; presence message is displayed.
              </p>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #EFE8E2", margin: 0 }} />

          {/* Toggle 2: Private Address */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <input
              id="showPrivateAddress"
              name="showPrivateAddress"
              type="checkbox"
              defaultChecked={showPrivateAddress}
              style={{ width: "20px", height: "20px", marginTop: "0.2rem", cursor: "pointer" }}
            />
            <div>
              <label htmlFor="showPrivateAddress" style={{ display: "block", fontWeight: 600, color: "#2B2425", fontSize: "0.95rem", cursor: "pointer" }}>
                Show Private Home Address (Where to Stay)
              </label>
              <p style={{ margin: "0.25rem 0 0 0", color: "#6E6264", fontSize: "0.85rem", lineHeight: 1.5 }}>
                Strict privacy requirement: By default (unchecked), the couple&apos;s private Vienna address is hidden and guests are given a contact recommendation CTA instead.
              </p>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #EFE8E2", margin: 0 }} />

          {/* Spotify Playlist URL */}
          <div>
            <label htmlFor="spotifyPlaylistUrl" style={{ display: "block", fontWeight: 600, color: "#2B2425", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
              Spotify Wedding Playlist URL
            </label>
            <input
              id="spotifyPlaylistUrl"
              name="spotifyPlaylistUrl"
              type="url"
              defaultValue={spotifyPlaylistUrl}
              placeholder="https://open.spotify.com/playlist/..."
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "6px",
                border: "1px solid #D5CBC4",
                fontSize: "0.9rem",
              }}
            />
          </div>

          {/* Contact Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label htmlFor="contactPhone" style={{ display: "block", fontWeight: 600, color: "#2B2425", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
                Organizer Phone
              </label>
              <input
                id="contactPhone"
                name="contactPhone"
                type="text"
                defaultValue={contactPhone}
                placeholder="+43 ..."
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "6px",
                  border: "1px solid #D5CBC4",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            <div>
              <label htmlFor="contactEmail" style={{ display: "block", fontWeight: 600, color: "#2B2425", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
                Organizer Email
              </label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={contactEmail}
                placeholder="wedding@example.com"
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "6px",
                  border: "1px solid #D5CBC4",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              style={{
                background: "#8C2836",
                color: "#FFFFFF",
                border: 0,
                borderRadius: "6px",
                padding: "0.75rem 1.6rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save Website Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
