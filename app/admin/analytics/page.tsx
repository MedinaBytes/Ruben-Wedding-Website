import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resilientStore } from "@/lib/storage/resilient-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics Timeline — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  const client = createSupabaseAdminClient();
  let remoteEvents: Array<Record<string, unknown>> = [];
  let remoteInvitations: Array<Record<string, unknown>> = [];

  try {
    const [eventsRes, invitationsRes] = await Promise.all([
      client
        .from("invitation_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      client.from("invitations").select("id, display_name"),
    ]);
    if (eventsRes.data) remoteEvents = eventsRes.data as Array<Record<string, unknown>>;
    if (invitationsRes.data) remoteInvitations = invitationsRes.data as Array<Record<string, unknown>>;
  } catch {}

  const localEvents = resilientStore.getEvents();
  const localInvitations = resilientStore.getInvitations();

  const nameMap = new Map<string, string>();
  for (const inv of localInvitations) {
    nameMap.set(inv.id, inv.display_name);
  }
  for (const inv of remoteInvitations) {
    const id = String(inv.id);
    if (!nameMap.has(id)) {
      nameMap.set(id, String(inv.display_name || "Guest"));
    }
  }

  const seenEventIds = new Set<string>();
  const events: Array<{ id: string; invitation_id: string; event_type: string; locale?: string | null; created_at: string }> = [];

  for (const e of localEvents) {
    seenEventIds.add(e.id);
    events.push({
      id: e.id,
      invitation_id: e.invitation_id,
      event_type: e.event_type,
      locale: e.locale,
      created_at: e.created_at,
    });
  }

  for (const e of remoteEvents) {
    const id = String(e.id);
    if (!seenEventIds.has(id)) {
      seenEventIds.add(id);
      events.push({
        id,
        invitation_id: String(e.invitation_id),
        event_type: String(e.event_type),
        locale: e.locale ? String(e.locale) : null,
        created_at: String(e.created_at || new Date().toISOString()),
      });
    }
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Group events by type for summary counts
  const eventCounts = new Map<string, number>();
  events.forEach((e) => {
    eventCounts.set(e.event_type, (eventCounts.get(e.event_type) || 0) + 1);
  });

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
          Engagement &amp; Event Timeline
        </h1>
        <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.9rem" }}>
          Client-side activity logged exclusively after interactive page load (link-preview scanners excluded).
        </p>
      </div>

      {/* Summary KPI Badges */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        {[
          { type: "INVITE_OPENED", label: "Opens", color: "#8C2836", bg: "#FBE9EB" },
          { type: "RSVP_CONFIRMED", label: "RSVP Yes", color: "#35652D", bg: "#E8F2E6" },
          { type: "RSVP_DECLINED", label: "RSVP No", color: "#9C2836", bg: "#FBE9EB" },
          { type: "SONG_REQUESTED", label: "Song Requests", color: "#1DB954", bg: "#EAF9EF" },
          { type: "MAP_OPENED", label: "Map Views", color: "#5F4B32", bg: "#F5EFE6" },
        ].map((item) => (
          <div
            key={item.type}
            style={{
              background: item.bg,
              color: item.color,
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            {item.label}: {eventCounts.get(item.type) || 0}
          </div>
        ))}
      </div>

      {/* Event Timeline Table */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#F7F3EF", borderBottom: "1px solid #E4DBD3", color: "#6A5E60", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Timestamp</th>
              <th style={{ padding: "0.75rem 1rem" }}>Guest / Invitation</th>
              <th style={{ padding: "0.75rem 1rem" }}>Event Type</th>
              <th style={{ padding: "0.75rem 1rem" }}>Locale</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "2.5rem", textAlign: "center", color: "#8E7F81" }}>
                  No engagement events recorded yet.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #EFEAE5" }}>
                  <td style={{ padding: "0.75rem 1rem", color: "#776A6C", fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#2B2425" }}>
                    {nameMap.get(e.invitation_id) || "Anonymous Guest"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        background: "#F2EDE8",
                        color: "#4A3E40",
                      }}
                    >
                      {e.event_type}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textTransform: "uppercase", fontSize: "0.8rem", color: "#776A6C" }}>
                    {e.locale || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
