"use client";

import { useState, useTransition } from "react";
import { sendBatchRsvpReminders, type ReminderResult } from "@/app/actions/admin-reminders";

export interface RsvpRow {
  invitationId: string;
  displayName: string;
  groupName: string | null;
  maxGuests: number;
  status: "yes" | "no" | "pending";
  attendeeCount: number;
  guestNames: string[];
  dietaryRequirements: string | null;
  notes: string | null;
  submittedAt: string | null;
}

function getPrimaryGuestName(displayName: string): string {
  return (
    displayName
      .replace(/\s*&\s*guest(\s*\(demo\))?/i, "")
      .replace(/\s*\(demo\)/i, "")
      .trim() || displayName
  );
}

export function RsvpsManager({
  rsvps,
  cateringSummary,
  enableMealSelection = true,
  enableRsvpReminders = true,
}: {
  rsvps: RsvpRow[];
  cateringSummary?: {
    totalConfirmed: number;
    meals: Record<string, number>;
    allergies: Array<{ guestName: string; allergies: string; meal: string }>;
  };
  enableMealSelection?: boolean;
  enableRsvpReminders?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no" | "pending">("all");
  const [reminderResult, setReminderResult] = useState<ReminderResult | null>(null);
  const [isReminding, startReminding] = useTransition();

  const filtered = rsvps.filter((r) => {
    const matchesSearch =
      r.displayName.toLowerCase().includes(search.toLowerCase()) ||
      r.guestNames.some((name) => name.toLowerCase().includes(search.toLowerCase())) ||
      (r.dietaryRequirements && r.dietaryRequirements.toLowerCase().includes(search.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = filter === "all" || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  function exportCsv() {
    const headers = [
      "Invitation Name",
      "Group",
      "Attendance",
      "Guest Count",
      "All Attending Guest Names",
      "Dietary Requirements",
      "Notes",
      "Submitted At",
    ];

    const rows = filtered.map((r) => {
      const primary = getPrimaryGuestName(r.displayName);
      const allNames = r.status === "yes" ? [primary, ...r.guestNames] : [];
      return [
        `"${r.displayName.replace(/"/g, '""')}"`,
        `"${(r.groupName || "").replace(/"/g, '""')}"`,
        r.status.toUpperCase(),
        r.attendeeCount,
        `"${allNames.join("; ").replace(/"/g, '""')}"`,
        `"${(r.dietaryRequirements || "").replace(/"/g, '""')}"`,
        `"${(r.notes || "").replace(/"/g, '""')}"`,
        r.submittedAt || "",
      ];
    });

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wedding_rsvps_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCatererCsv() {
    if (!cateringSummary) return;
    const headers = ["Guest Name", "Meal Choice", "Allergies / Intolerances"];
    const rows = cateringSummary.allergies.map((a) => [
      `"${a.guestName.replace(/"/g, '""')}"`,
      `"${a.meal.replace(/"/g, '""')}"`,
      `"${a.allergies.replace(/"/g, '""')}"`,
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `caterer_dietary_sheet_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleBatchReminders() {
    if (!confirm("Send follow-up reminders to all pending guest invitations via Email & WhatsApp queue?")) return;
    startReminding(async () => {
      const res = await sendBatchRsvpReminders();
      setReminderResult(res);
    });
  }

  const yesCount = rsvps.filter((r) => r.status === "yes").length;
  const noCount = rsvps.filter((r) => r.status === "no").length;
  const pendingCount = rsvps.filter((r) => r.status === "pending").length;
  const totalAttendees = rsvps.filter((r) => r.status === "yes").reduce((s, r) => s + r.attendeeCount, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
            Guest RSVPs &amp; Attendance
          </h1>
          <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.9rem" }}>
            {totalAttendees} Confirmed Guests · {yesCount} Attending · {noCount} Declined · {pendingCount} Pending
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {enableRsvpReminders && (
            <button
              type="button"
              onClick={handleBatchReminders}
              disabled={isReminding}
              style={{
                background: "#8C2836",
                color: "#FFFFFF",
                border: 0,
                borderRadius: "6px",
                padding: "0.55rem 1.1rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(140, 40, 54, 0.2)",
              }}
            >
              {isReminding ? "Preparing Reminders..." : "🔔 Send Batch RSVP Reminders"}
            </button>
          )}

          <button
            type="button"
            onClick={exportCsv}
            style={{
              background: "#55644E",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "6px",
              padding: "0.55rem 1.1rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            ⬇ Export RSVPs (CSV)
          </button>
        </div>
      </div>

      {reminderResult && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem 1.25rem",
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            borderRadius: "8px",
            color: "#065F46",
            fontSize: "0.88rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <strong>✓ Batch Reminders Queued:</strong> {reminderResult.remindersPrepared} pending invitations prepared ({reminderResult.emailsSent} via Email, {reminderResult.whatsAppPrepared} with WhatsApp numbers).
          </div>
          <button
            type="button"
            onClick={() => setReminderResult(null)}
            style={{ background: "transparent", border: 0, cursor: "pointer", color: "#065F46" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Caterer Dietary & Menu Breakdown Card */}
      {enableMealSelection && cateringSummary && (
        <div
          style={{
            marginBottom: "1.75rem",
            background: "#FFFFFF",
            border: "1px solid #E4DBD3",
            borderRadius: "10px",
            padding: "1.5rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.4rem" }}>🍽️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontFamily: "var(--font-display, serif)", color: "#2B2425" }}>
                  Schloss Hetzendorf Caterer Summary
                </h3>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#6A5D60" }}>
                  Live course breakdown for kitchen head chef &amp; banquet service
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={exportCatererCsv}
              style={{
                background: "transparent",
                border: "1px solid #D5CBC4",
                borderRadius: "6px",
                padding: "0.4rem 0.85rem",
                fontSize: "0.82rem",
                color: "#4A3E3D",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              📄 Export Caterer Diet Sheet (CSV)
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ background: "#FAF7F5", padding: "0.85rem", borderRadius: "8px", border: "1px solid #EBE4DD", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#8C2836" }}>{cateringSummary.meals.classic || 0}</div>
              <div style={{ fontSize: "0.78rem", color: "#544648", marginTop: "2px" }}>🥩 Beef Classic</div>
            </div>
            <div style={{ background: "#FAF7F5", padding: "0.85rem", borderRadius: "8px", border: "1px solid #EBE4DD", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2563EB" }}>{cateringSummary.meals.fish || 0}</div>
              <div style={{ fontSize: "0.78rem", color: "#544648", marginTop: "2px" }}>🐟 Fish / Trout</div>
            </div>
            <div style={{ background: "#FAF7F5", padding: "0.85rem", borderRadius: "8px", border: "1px solid #EBE4DD", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#059669" }}>{cateringSummary.meals.vegetarian || 0}</div>
              <div style={{ fontSize: "0.78rem", color: "#544648", marginTop: "2px" }}>🥗 Vegetarian</div>
            </div>
            <div style={{ background: "#FAF7F5", padding: "0.85rem", borderRadius: "8px", border: "1px solid #EBE4DD", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#16A34A" }}>{cateringSummary.meals.vegan || 0}</div>
              <div style={{ fontSize: "0.78rem", color: "#544648", marginTop: "2px" }}>🌿 Vegan</div>
            </div>
            <div style={{ background: "#FAF7F5", padding: "0.85rem", borderRadius: "8px", border: "1px solid #EBE4DD", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#D97706" }}>{cateringSummary.meals.kids || 0}</div>
              <div style={{ fontSize: "0.78rem", color: "#544648", marginTop: "2px" }}>🧒 Kids Menu</div>
            </div>
          </div>

          {cateringSummary.allergies.length > 0 && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "6px", padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#991B1B" }}>
              <strong>⚠️ Allergies &amp; Intolerances ({cateringSummary.allergies.length}):</strong>
              <div style={{ marginTop: "0.35rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {cateringSummary.allergies.map((a, idx) => (
                  <span key={idx} style={{ background: "#FFF", padding: "0.2rem 0.5rem", borderRadius: "4px", border: "1px solid #FCA5A5" }}>
                    <strong>{a.guestName}:</strong> {a.allergies} ({a.meal})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Filter by guest name, dietary requirement, or note..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: "240px",
            padding: "0.55rem 0.85rem",
            borderRadius: "6px",
            border: "1px solid #D5CBC4",
            fontSize: "0.9rem",
            background: "#FFFFFF",
          }}
        />

        <div style={{ display: "flex", gap: "0.3rem" }}>
          {(["all", "yes", "no", "pending"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFilter(opt)}
              style={{
                padding: "0.45rem 0.8rem",
                borderRadius: "6px",
                border: "1px solid #D5CBC4",
                background: filter === opt ? "#8C2836" : "#FFFFFF",
                color: filter === opt ? "#FFFFFF" : "#544648",
                fontSize: "0.82rem",
                fontWeight: 500,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {opt === "all" ? "All" : opt}
            </button>
          ))}
        </div>
      </div>

      {/* RSVPs Table */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#F7F3EF", borderBottom: "1px solid #E4DBD3", color: "#6A5E60", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Invitation</th>
              <th style={{ padding: "0.75rem 1rem" }}>Status</th>
              <th style={{ padding: "0.75rem 1rem" }}>Count</th>
              <th style={{ padding: "0.75rem 1rem" }}>Attending Guests</th>
              <th style={{ padding: "0.75rem 1rem" }}>Dietary Requirements</th>
              <th style={{ padding: "0.75rem 1rem" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "#8E7F81" }}>
                  No RSVPs found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.invitationId} style={{ borderBottom: "1px solid #EFEAE5" }}>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "#2B2425" }}>{r.displayName}</p>
                    {r.groupName && <span style={{ fontSize: "0.78rem", color: "#776A6C" }}>{r.groupName}</span>}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "999px",
                        fontWeight: 600,
                        background:
                          r.status === "yes"
                            ? "#E8F2E6"
                            : r.status === "no"
                              ? "#FBE9EB"
                              : "#F4EFEA",
                        color:
                          r.status === "yes"
                            ? "#35652D"
                            : r.status === "no"
                              ? "#9C2836"
                              : "#8E7D6F",
                      }}
                    >
                      {r.status === "yes" ? "Attending" : r.status === "no" ? "Declined" : "Pending"}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                    {r.status === "yes" ? (
                      <span style={{ color: "#2B2425" }}>
                        {r.attendeeCount} / {r.maxGuests}
                      </span>
                    ) : r.status === "no" ? (
                      <span style={{ color: "#9C2836" }}>0</span>
                    ) : (
                      <span style={{ color: "#A89C9E" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", minWidth: "160px" }}>
                    {r.status === "yes" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <div style={{ fontWeight: 600, color: "#2B2425", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <span>1.</span> {getPrimaryGuestName(r.displayName)}
                          {r.attendeeCount === 1 && r.maxGuests > 1 && (
                            <span style={{ fontSize: "0.72rem", background: "#F4EFEA", color: "#776A6C", padding: "0.1rem 0.4rem", borderRadius: "3px" }}>
                              Solo
                            </span>
                          )}
                        </div>
                        {r.guestNames.map((name, i) => (
                          <div key={i} style={{ color: "#544648", fontSize: "0.84rem", paddingLeft: "0.4rem", borderLeft: "2px solid #D5CBC4" }}>
                            <span>{i + 2}.</span> {name}{" "}
                            {i === 0 && r.maxGuests === 2 ? (
                              <span style={{ color: "#8C2836", fontWeight: 600, fontSize: "0.74rem" }}>(+1)</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : r.status === "no" ? (
                      <span style={{ color: "#9C2836", fontSize: "0.82rem", fontStyle: "italic" }}>Declined</span>
                    ) : (
                      <span style={{ color: "#A89C9E", fontSize: "0.82rem" }}>Awaiting reply</span>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", maxWidth: "220px" }}>
                    {r.dietaryRequirements ? (
                      <span
                        style={{
                          display: "inline-block",
                          background: "#FEF7EE",
                          color: "#874D00",
                          border: "1px solid #F8DDB7",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.82rem",
                          fontWeight: 500,
                          lineHeight: 1.35,
                          wordBreak: "break-word",
                        }}
                      >
                        {r.dietaryRequirements}
                      </span>
                    ) : (
                      <span style={{ color: "#B5A8AA" }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", maxWidth: "240px" }}>
                    {r.notes ? (
                      <span
                        style={{
                          display: "inline-block",
                          fontStyle: "italic",
                          color: "#44393B",
                          fontSize: "0.84rem",
                          lineHeight: 1.4,
                          wordBreak: "break-word",
                        }}
                      >
                        “{r.notes}”
                      </span>
                    ) : (
                      <span style={{ color: "#B5A8AA" }}>—</span>
                    )}
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
