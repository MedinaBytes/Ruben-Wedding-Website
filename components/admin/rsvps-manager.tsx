"use client";

import { useState } from "react";

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

export function RsvpsManager({ rsvps }: { rsvps: RsvpRow[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no" | "pending">("all");

  const filtered = rsvps.filter((r) => {
    const matchesSearch =
      r.displayName.toLowerCase().includes(search.toLowerCase()) ||
      r.guestNames.some((name) => name.toLowerCase().includes(search.toLowerCase())) ||
      (r.dietaryRequirements && r.dietaryRequirements.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = filter === "all" || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  function exportCsv() {
    const headers = [
      "Invitation Name",
      "Group",
      "Attendance",
      "Guest Count",
      "Additional Guest Names",
      "Dietary Requirements",
      "Notes",
      "Submitted At",
    ];

    const rows = filtered.map((r) => [
      `"${r.displayName.replace(/"/g, '""')}"`,
      `"${(r.groupName || "").replace(/"/g, '""')}"`,
      r.status.toUpperCase(),
      r.attendeeCount,
      `"${r.guestNames.join("; ").replace(/"/g, '""')}"`,
      `"${(r.dietaryRequirements || "").replace(/"/g, '""')}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
      r.submittedAt || "",
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wedding_rsvps_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
          ⬇ Export RSVPs to CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Filter by guest name or dietary requirement..."
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
              <th style={{ padding: "0.75rem 1rem" }}>Names</th>
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
                    {r.status === "yes" ? `${r.attendeeCount} / ${r.maxGuests}` : "0"}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#44393B" }}>
                    {r.guestNames.length > 0 ? r.guestNames.join(", ") : "—"}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: r.dietaryRequirements ? "#8C2836" : "#776A6C", maxWidth: "220px" }}>
                    {r.dietaryRequirements || "—"}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#544648", maxWidth: "220px" }}>
                    {r.notes || "—"}
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
