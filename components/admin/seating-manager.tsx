"use client";

import { useState, useTransition } from "react";
import { saveTableAssignmentAction, deleteTableAssignmentAction } from "@/app/actions/admin-seating";
import type { StoredTableAssignment } from "@/lib/storage/resilient-store";

export interface ConfirmedGuestItem {
  invitationId: string;
  guestName: string;
  groupName?: string | null;
  dietary?: string | null;
  meal?: string | null;
}

const DEFAULT_TABLES = [
  { number: 1, name: "Ehrentisch (Head Table)", capacity: 8 },
  { number: 2, name: "Schloss Hetzendorf", capacity: 10 },
  { number: 3, name: "Schönbrunn Salon", capacity: 10 },
  { number: 4, name: "St. Oswald", capacity: 10 },
  { number: 5, name: "Wiener Walzer", capacity: 10 },
  { number: 6, name: "Belvedere", capacity: 8 },
  { number: 7, name: "Donauzauber", capacity: 8 },
  { number: 8, name: "Kaiserin Elisabeth", capacity: 8 },
];

export function SeatingManager({
  initialAssignments,
  confirmedGuests,
  isEnabled = true,
}: {
  initialAssignments: StoredTableAssignment[];
  confirmedGuests: ConfirmedGuestItem[];
  isEnabled?: boolean;
}) {
  const [assignments, setAssignments] = useState<StoredTableAssignment[]>(initialAssignments);
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const assignedGuestNames = new Set(assignments.map((a) => a.guest_name.toLowerCase()));
  const unassignedGuests = confirmedGuests.filter(
    (g) => !assignedGuestNames.has(g.guestName.toLowerCase()),
  );

  const filteredUnassigned = unassignedGuests.filter(
    (g) =>
      g.guestName.toLowerCase().includes(search.toLowerCase()) ||
      (g.groupName && g.groupName.toLowerCase().includes(search.toLowerCase())),
  );

  function handleAssign(guest: ConfirmedGuestItem) {
    const tableDef = DEFAULT_TABLES.find((t) => t.number === selectedTable) || DEFAULT_TABLES[0];
    const newAssignment: StoredTableAssignment = {
      id: `seat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      table_number: tableDef.number,
      table_name: tableDef.name,
      guest_name: guest.guestName,
      invitation_id: guest.invitationId,
      notes: guest.dietary ? `Diet: ${guest.dietary}` : undefined,
      created_at: new Date().toISOString(),
    };

    setAssignments((prev) => [...prev, newAssignment]);

    startTransition(async () => {
      await saveTableAssignmentAction({
        tableNumber: tableDef.number,
        tableName: tableDef.name,
        guestName: guest.guestName,
        invitationId: guest.invitationId,
        notes: guest.dietary ? `Diet: ${guest.dietary}` : undefined,
      });
    });
  }

  function handleRemove(id: string) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    startTransition(async () => {
      await deleteTableAssignmentAction(id);
    });
  }

  function exportSeatingChart() {
    const headers = ["Table #", "Table Name", "Guest Name", "Notes"];
    const rows = assignments
      .sort((a, b) => a.table_number - b.table_number)
      .map((a) => [
        a.table_number,
        `"${a.table_name.replace(/"/g, '""')}"`,
        `"${a.guest_name.replace(/"/g, '""')}"`,
        `"${(a.notes || "").replace(/"/g, '""')}"`,
      ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hetzendorf_seating_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: "1280px" }}>
      {!isEnabled && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "0.85rem 1.25rem",
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            color: "#92400E",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span>⚠️</span>
          <span>
            <strong>Module Status:</strong> The Table Seating Planner is currently toggled <strong>OFF</strong> in Settings.
            You can still organize tables internally here, but guest-facing seating notices remain disabled.
          </span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "2rem",
              margin: "0 0 0.25rem 0",
              color: "#2B2425",
            }}
          >
            Schloss Hetzendorf Table Seating Planner
          </h1>
          <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.9rem" }}>
            {assignments.length} assigned · {unassignedGuests.length} unassigned of {confirmedGuests.length} confirmed guests
          </p>
        </div>

        <button
          type="button"
          onClick={exportSeatingChart}
          style={{
            background: "#8C2836",
            color: "#FFF",
            border: 0,
            borderRadius: "6px",
            padding: "0.6rem 1.25rem",
            fontSize: "0.88rem",
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(140, 40, 54, 0.2)",
          }}
        >
          📥 Export Seating Chart (CSV)
        </button>
      </div>

      {/* Main Grid: Left = Tables, Right = Unassigned Guests Drawer */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2.5fr 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Tables Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {DEFAULT_TABLES.map((table) => {
            const tableGuests = assignments.filter((a) => a.table_number === table.number);
            const isFull = tableGuests.length >= table.capacity;
            const isSelected = selectedTable === table.number;

            return (
              <div
                key={table.number}
                onClick={() => setSelectedTable(table.number)}
                style={{
                  background: isSelected ? "#FFFFFF" : "#FAF8F6",
                  border: isSelected ? "2px solid #8C2836" : "1px solid #E5DCD3",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 4px 16px rgba(140, 40, 54, 0.12)" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "0.75rem",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontFamily: "var(--font-display, serif)",
                      color: "#2B2425",
                    }}
                  >
                    Table {table.number}: {table.name}
                  </h3>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "999px",
                      background: isFull ? "rgba(140, 40, 54, 0.1)" : "rgba(85, 100, 78, 0.1)",
                      color: isFull ? "#8C2836" : "#55644E",
                    }}
                  >
                    {tableGuests.length} / {table.capacity}
                  </span>
                </div>

                {/* Assigned Guests List */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                    minHeight: "120px",
                  }}
                >
                  {tableGuests.length === 0 ? (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#998889",
                        fontStyle: "italic",
                        padding: "1rem 0",
                        textAlign: "center",
                      }}
                    >
                      Click to select, then click an unassigned guest on the right to place them here.
                    </div>
                  ) : (
                    tableGuests.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.35rem 0.6rem",
                          background: "#FFFFFF",
                          border: "1px solid #ECE4DD",
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                        }}
                      >
                        <span style={{ fontWeight: 500, color: "#332627" }}>{g.guest_name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(g.id);
                          }}
                          style={{
                            background: "transparent",
                            border: 0,
                            color: "#8C2836",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            padding: "0 0.2rem",
                          }}
                          title="Remove from table"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unassigned Guests Drawer */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5DCD3",
            borderRadius: "10px",
            padding: "1.25rem",
            position: "sticky",
            top: "5rem",
          }}
        >
          <h3
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "1.05rem",
              fontFamily: "var(--font-display, serif)",
              color: "#2B2425",
            }}
          >
            Unassigned Guests ({unassignedGuests.length})
          </h3>
          <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", color: "#6A5D60" }}>
            Placing into <strong>Table {selectedTable}</strong>. Click any guest to assign.
          </p>

          <input
            type="text"
            placeholder="Search unassigned..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid #D5CBC4",
              fontSize: "0.85rem",
              marginBottom: "1rem",
            }}
          />

          <div
            style={{
              maxHeight: "450px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {filteredUnassigned.length === 0 ? (
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "#55644E",
                  textAlign: "center",
                  padding: "1.5rem 0",
                }}
              >
                🎉 All confirmed guests have been assigned to tables!
              </div>
            ) : (
              filteredUnassigned.map((guest, idx) => (
                <button
                  key={`${guest.invitationId}-${guest.guestName}-${idx}`}
                  type="button"
                  onClick={() => handleAssign(guest)}
                  disabled={isPending}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    textAlign: "left",
                    padding: "0.55rem 0.75rem",
                    background: "#FAF7F5",
                    border: "1px solid #ECE4DD",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: "#2B2425",
                    transition: "all 0.1s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F2ECE7")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#FAF7F5")}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{guest.guestName}</div>
                    {guest.groupName && (
                      <div style={{ fontSize: "0.75rem", color: "#776A6C" }}>{guest.groupName}</div>
                    )}
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#8C2836", fontWeight: 600 }}>
                    + Table {selectedTable}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
