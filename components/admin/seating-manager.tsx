"use client";

import { useState, useTransition } from "react";
import {
  saveTableAssignmentAction,
  deleteTableAssignmentAction,
  saveTableAction,
  deleteTableAction,
} from "@/app/actions/admin-seating";
import type { StoredTableAssignment, StoredTableDefinition } from "@/lib/storage/resilient-store";

export const DEFAULT_IMPERIAL_TABLES: StoredTableDefinition[] = [
  { number: 1, name: "Ehrentisch (Head Table)", capacity: 8 },
  { number: 2, name: "Schloss Hetzendorf", capacity: 10 },
  { number: 3, name: "Schönbrunn Salon", capacity: 10 },
  { number: 4, name: "St. Oswald", capacity: 10 },
  { number: 5, name: "Wiener Walzer", capacity: 10 },
  { number: 6, name: "Belvedere", capacity: 8 },
  { number: 7, name: "Donauzauber", capacity: 8 },
  { number: 8, name: "Kaiserin Elisabeth", capacity: 8 },
];

export interface ConfirmedGuestItem {
  invitationId: string;
  guestName: string;
  groupName?: string | null;
  dietary?: string | null;
  meal?: string | null;
}

function generateAssignmentId(): string {
  return `seat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

function getCurrentIsoTimestamp(): string {
  return new Date().toISOString();
}

export function SeatingManager({
  initialAssignments,
  initialTables = DEFAULT_IMPERIAL_TABLES,
  confirmedGuests,
  isEnabled = true,
}: {
  initialAssignments: StoredTableAssignment[];
  initialTables?: StoredTableDefinition[];
  confirmedGuests: ConfirmedGuestItem[];
  isEnabled?: boolean;
}) {
  const [tables, setTables] = useState<StoredTableDefinition[]>(
    initialTables && initialTables.length > 0 ? initialTables : DEFAULT_IMPERIAL_TABLES,
  );
  const [assignments, setAssignments] = useState<StoredTableAssignment[]>(initialAssignments);
  const [selectedTable, setSelectedTable] = useState<number>(
    initialTables && initialTables.length > 0 ? initialTables[0].number : 1,
  );
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Table Editing State
  const [editingTableNumber, setEditingTableNumber] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; capacity: number }>({ name: "", capacity: 10 });

  // Add Table Modal / Inline State
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableForm, setNewTableForm] = useState<{ number: number; name: string; capacity: number }>({
    number: 1,
    name: "",
    capacity: 10,
  });

  // Table Deletion Confirmation State
  const [deletingTableNumber, setDeletingTableNumber] = useState<number | null>(null);

  // Status message notification
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  }

  const assignedGuestNames = new Set(assignments.map((a) => a.guest_name.toLowerCase()));
  const unassignedGuests = confirmedGuests.filter(
    (g) => !assignedGuestNames.has(g.guestName.toLowerCase()),
  );

  const filteredUnassigned = unassignedGuests.filter(
    (g) =>
      g.guestName.toLowerCase().includes(search.toLowerCase()) ||
      (g.groupName && g.groupName.toLowerCase().includes(search.toLowerCase())),
  );

  const activeTableDef = tables.find((t) => t.number === selectedTable) || tables[0];

  // 1. Assign Guest to Selected Table
  function handleAssign(guest: ConfirmedGuestItem) {
    if (!activeTableDef) return;

    const newAssignment: StoredTableAssignment = {
      id: generateAssignmentId(),
      table_number: activeTableDef.number,
      table_name: activeTableDef.name,
      guest_name: guest.guestName,
      invitation_id: guest.invitationId,
      notes: guest.dietary ? `Diet: ${guest.dietary}` : undefined,
      created_at: getCurrentIsoTimestamp(),
    };

    setAssignments((prev) => [...prev, newAssignment]);

    startTransition(async () => {
      await saveTableAssignmentAction({
        tableNumber: activeTableDef.number,
        tableName: activeTableDef.name,
        guestName: guest.guestName,
        invitationId: guest.invitationId,
        notes: guest.dietary ? `Diet: ${guest.dietary}` : undefined,
      });
    });
  }

  // 2. Remove Guest from Table
  function handleRemove(id: string) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    startTransition(async () => {
      await deleteTableAssignmentAction(id);
    });
  }

  // 3. Start Editing a Table (Name / Capacity)
  function handleStartEdit(table: StoredTableDefinition) {
    setEditingTableNumber(table.number);
    setEditForm({ name: table.name, capacity: table.capacity });
  }

  // 4. Save Table Edit
  function handleSaveEdit(tableNumber: number) {
    const trimmedName = editForm.name.trim();
    if (!trimmedName) return;

    const newCap = Math.max(1, Number(editForm.capacity) || 10);

    // Update tables in state
    setTables((prev) =>
      prev.map((t) => (t.number === tableNumber ? { ...t, name: trimmedName, capacity: newCap } : t)),
    );

    // Update assignment records so table names stay in sync
    setAssignments((prev) =>
      prev.map((a) => (a.table_number === tableNumber ? { ...a, table_name: trimmedName } : a)),
    );

    setEditingTableNumber(null);
    showFeedback(`Table ${tableNumber} updated to "${trimmedName}" (${newCap} seats).`);

    startTransition(async () => {
      await saveTableAction({
        number: tableNumber,
        name: trimmedName,
        capacity: newCap,
      });
    });
  }

  // 5. Open Add Table Form
  function handleOpenAddTable() {
    const maxNum = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) : 0;
    setNewTableForm({
      number: maxNum + 1,
      name: "",
      capacity: 10,
    });
    setIsAddingTable(true);
  }

  // 6. Save New Table
  function handleSaveNewTable() {
    const trimmedName = newTableForm.name.trim() || `Table ${newTableForm.number}`;
    const tableNum = Number(newTableForm.number);
    const capacity = Math.max(1, Number(newTableForm.capacity) || 10);

    // Ensure unique table number
    if (tables.some((t) => t.number === tableNum)) {
      alert(`Table number ${tableNum} already exists. Please choose a unique number.`);
      return;
    }

    const newTable: StoredTableDefinition = {
      number: tableNum,
      name: trimmedName,
      capacity,
    };

    const nextTables = [...tables, newTable].sort((a, b) => a.number - b.number);
    setTables(nextTables);
    setSelectedTable(tableNum);
    setIsAddingTable(false);
    showFeedback(`Added new Table ${tableNum}: "${trimmedName}" (${capacity} seats).`);

    startTransition(async () => {
      await saveTableAction(newTable);
    });
  }

  // 7. Delete Table
  function handleConfirmDeleteTable(tableNumber: number) {
    const tableToDelete = tables.find((t) => t.number === tableNumber);
    if (!tableToDelete) return;

    // Filter out table
    const remainingTables = tables.filter((t) => t.number !== tableNumber);
    setTables(remainingTables);

    // Unassign guests at this table
    const guestsAtTable = assignments.filter((a) => a.table_number === tableNumber);
    setAssignments((prev) => prev.filter((a) => a.table_number !== tableNumber));

    // Update selected table if we just deleted it
    if (selectedTable === tableNumber) {
      if (remainingTables.length > 0) {
        setSelectedTable(remainingTables[0].number);
      }
    }

    setDeletingTableNumber(null);
    showFeedback(
      `Table ${tableNumber} ("${tableToDelete.name}") removed. ${guestsAtTable.length} guest(s) returned to unassigned list.`,
    );

    startTransition(async () => {
      await deleteTableAction(tableNumber);
    });
  }

  // 8. Export CSV Chart
  function exportSeatingChart() {
    const headers = ["Table #", "Table Name", "Guest Name", "Notes"];
    const rows = assignments
      .sort((a, b) => Number(a.table_number) - Number(b.table_number))
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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {feedback && (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "0.75rem 1.25rem",
            background: "rgba(85, 100, 78, 0.1)",
            border: "1px solid rgba(85, 100, 78, 0.3)",
            borderRadius: "8px",
            color: "#45533E",
            fontSize: "0.88rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>✨</span>
          <span>{feedback}</span>
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
            {assignments.length} assigned · {unassignedGuests.length} unassigned of {confirmedGuests.length} confirmed guests · {tables.length} customizable tables
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleOpenAddTable}
            style={{
              background: "#FFFFFF",
              color: "#8C2836",
              border: "1.5px solid #8C2836",
              borderRadius: "6px",
              padding: "0.6rem 1.15rem",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#8C2836";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FFFFFF";
              e.currentTarget.style.color = "#8C2836";
            }}
          >
            <span>+</span>
            <span>Add New Table</span>
          </button>

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
      </div>

      {/* Add New Table Modal / Inline Banner */}
      {isAddingTable && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1.25rem 1.5rem",
            background: "#FFFFFF",
            border: "2px solid #CCA468",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(204, 164, 104, 0.15)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#8C2836", fontFamily: "var(--font-display, serif)" }}>
              Add a New Table
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingTable(false)}
              style={{ background: "transparent", border: 0, color: "#776A6C", cursor: "pointer", fontSize: "1.2rem" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px auto", gap: "1rem", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#5A4E51", marginBottom: "0.3rem" }}>
                Table #
              </label>
              <input
                type="number"
                min="1"
                value={newTableForm.number}
                onChange={(e) => setNewTableForm({ ...newTableForm, number: parseInt(e.target.value) || 1 })}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "6px",
                  border: "1px solid #D5CBC4",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#5A4E51", marginBottom: "0.3rem" }}>
                Table Name / Theme
              </label>
              <input
                type="text"
                placeholder="e.g. Belvedere Salon, Royal Court, Table 9"
                value={newTableForm.name}
                onChange={(e) => setNewTableForm({ ...newTableForm, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #D5CBC4",
                  fontSize: "0.88rem",
                }}
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#5A4E51", marginBottom: "0.3rem" }}>
                Seat Capacity
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={newTableForm.capacity}
                onChange={(e) => setNewTableForm({ ...newTableForm, capacity: parseInt(e.target.value) || 10 })}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "6px",
                  border: "1px solid #D5CBC4",
                  fontSize: "0.88rem",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={handleSaveNewTable}
                style={{
                  background: "#8C2836",
                  color: "#FFFFFF",
                  border: 0,
                  borderRadius: "6px",
                  padding: "0.55rem 1.25rem",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Create Table
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTable(false)}
                style={{
                  background: "#F5EFEB",
                  color: "#5A4E51",
                  border: 0,
                  borderRadius: "6px",
                  padding: "0.55rem 1rem",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTableNumber !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              padding: "1.75rem",
              maxWidth: "460px",
              width: "90%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 0.75rem 0", color: "#8C2836", fontSize: "1.25rem", fontFamily: "var(--font-display, serif)" }}>
              Remove Table {deletingTableNumber}?
            </h3>
            <p style={{ margin: "0 0 1.25rem 0", color: "#4A3E40", fontSize: "0.9rem", lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>Table {deletingTableNumber}</strong> (
              {tables.find((t) => t.number === deletingTableNumber)?.name})?
              <br />
              Any currently seated guests ({assignments.filter((a) => a.table_number === deletingTableNumber).length}) will be safely unassigned and returned to the unassigned guests drawer.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setDeletingTableNumber(null)}
                style={{
                  background: "#FAF7F5",
                  border: "1px solid #D5CBC4",
                  borderRadius: "6px",
                  padding: "0.5rem 1rem",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteTable(deletingTableNumber)}
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: 0,
                  borderRadius: "6px",
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Yes, Remove Table
              </button>
            </div>
          </div>
        </div>
      )}

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
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "1rem",
          }}
        >
          {tables.map((table) => {
            const tableGuests = assignments.filter((a) => a.table_number === table.number);
            const isFull = tableGuests.length >= table.capacity;
            const isSelected = selectedTable === table.number;
            const isEditing = editingTableNumber === table.number;

            return (
              <div
                key={table.number}
                onClick={() => {
                  if (!isEditing) setSelectedTable(table.number);
                }}
                style={{
                  background: isSelected ? "#FFFFFF" : "#FAF8F6",
                  border: isSelected ? "2px solid #8C2836" : "1px solid #E5DCD3",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  cursor: isEditing ? "default" : "pointer",
                  transition: "all 0.18s ease",
                  boxShadow: isSelected
                    ? "0 4px 18px rgba(140, 40, 54, 0.14)"
                    : "0 2px 6px rgba(0,0,0,0.02)",
                  position: "relative",
                }}
              >
                {/* Active Placement Indicator */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      left: "14px",
                      background: "#8C2836",
                      color: "#FFFFFF",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: "0.15rem 0.55rem",
                      borderRadius: "999px",
                      boxShadow: "0 2px 6px rgba(140, 40, 54, 0.3)",
                    }}
                  >
                    Active Table
                  </div>
                )}

                {/* Table Header / In-place Edit Form */}
                {isEditing ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #CCA468",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div style={{ marginBottom: "0.5rem" }}>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6A5D60" }}>
                        Table Name:
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.35rem 0.5rem",
                          borderRadius: "4px",
                          border: "1px solid #CCA468",
                          fontSize: "0.88rem",
                          fontWeight: 600,
                        }}
                        autoFocus
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6A5D60" }}>Capacity:</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={editForm.capacity}
                        onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 1 })}
                        style={{
                          width: "60px",
                          padding: "0.3rem 0.4rem",
                          borderRadius: "4px",
                          border: "1px solid #D5CBC4",
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(table.number)}
                        style={{
                          background: "#8C2836",
                          color: "#FFF",
                          border: 0,
                          borderRadius: "4px",
                          padding: "0.3rem 0.75rem",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ✓ Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTableNumber(null)}
                        style={{
                          background: "#F5EFEB",
                          color: "#5A4E51",
                          border: 0,
                          borderRadius: "4px",
                          padding: "0.3rem 0.55rem",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.75rem",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#8C2836",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}
                        >
                          Table {table.number}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(table);
                          }}
                          style={{
                            background: "transparent",
                            border: 0,
                            color: "#8C2836",
                            cursor: "pointer",
                            padding: "0 0.2rem",
                            fontSize: "0.85rem",
                            opacity: 0.75,
                            transition: "opacity 0.15s ease",
                          }}
                          title="Rename Table or Change Capacity"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingTableNumber(table.number);
                          }}
                          style={{
                            background: "transparent",
                            border: 0,
                            color: "#998889",
                            cursor: "pointer",
                            padding: "0 0.2rem",
                            fontSize: "0.85rem",
                            opacity: 0.75,
                            transition: "all 0.15s ease",
                          }}
                          title="Delete Table"
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#998889")}
                        >
                          🗑️
                        </button>
                      </div>

                      <h3
                        style={{
                          margin: "0.2rem 0 0 0",
                          fontSize: "1.05rem",
                          fontFamily: "var(--font-display, serif)",
                          color: "#2B2425",
                          lineHeight: 1.3,
                        }}
                      >
                        {table.name}
                      </h3>
                    </div>

                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                        background: isFull ? "rgba(140, 40, 54, 0.12)" : "rgba(85, 100, 78, 0.12)",
                        color: isFull ? "#8C2836" : "#45533E",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tableGuests.length} / {table.capacity}
                    </span>
                  </div>
                )}

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
                        padding: "1.25rem 0",
                        textAlign: "center",
                      }}
                    >
                      Empty table. Select and click guests on the right to seat them here.
                    </div>
                  ) : (
                    tableGuests.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.4rem 0.65rem",
                          background: "#FFFFFF",
                          border: "1px solid #ECE4DD",
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "#332627" }}>{g.guest_name}</span>
                          {g.notes && (
                            <span style={{ fontSize: "0.72rem", color: "#8C2836", fontStyle: "italic" }}>
                              {g.notes}
                            </span>
                          )}
                        </div>
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
                            fontSize: "0.95rem",
                            padding: "0 0.3rem",
                            lineHeight: 1,
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

          {/* Quick Add Table Card */}
          <div
            onClick={handleOpenAddTable}
            style={{
              background: "rgba(204, 164, 104, 0.05)",
              border: "2px dashed rgba(204, 164, 104, 0.4)",
              borderRadius: "10px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              cursor: "pointer",
              minHeight: "180px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#8C2836";
              e.currentTarget.style.background = "rgba(140, 40, 54, 0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(204, 164, 104, 0.4)";
              e.currentTarget.style.background = "rgba(204, 164, 104, 0.05)";
            }}
          >
            <span style={{ fontSize: "1.75rem", color: "#8C2836", lineHeight: 1 }}>+</span>
            <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "#8C2836" }}>Add Another Table</span>
            <span style={{ fontSize: "0.75rem", color: "#8A7D80", textAlign: "center" }}>
              Personalize table name & capacity
            </span>
          </div>
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
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
          }}
        >
          <h3
            style={{
              margin: "0 0 0.35rem 0",
              fontSize: "1.05rem",
              fontFamily: "var(--font-display, serif)",
              color: "#2B2425",
            }}
          >
            Unassigned Guests ({unassignedGuests.length})
          </h3>
          <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", color: "#6A5D60" }}>
            Placing into: <strong style={{ color: "#8C2836" }}>Table {selectedTable} ({activeTableDef?.name})</strong>.
            Click any guest to seat them.
          </p>

          <input
            type="text"
            placeholder="Search unassigned guests..."
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
                  color: "#45533E",
                  textAlign: "center",
                  padding: "1.75rem 0.5rem",
                  background: "rgba(85, 100, 78, 0.05)",
                  borderRadius: "8px",
                  lineHeight: 1.5,
                }}
              >
                🎉 <strong>All confirmed guests are assigned!</strong>
                <br />
                Every guest has their seat at Hetzendorf Palace.
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
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F2ECE7")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#FAF7F5")}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{guest.guestName}</div>
                    {guest.groupName && (
                      <div style={{ fontSize: "0.74rem", color: "#776A6C" }}>{guest.groupName}</div>
                    )}
                    {guest.dietary && (
                      <div style={{ fontSize: "0.72rem", color: "#8C2836", fontStyle: "italic" }}>
                        Diet: {guest.dietary}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#8C2836", fontWeight: 700 }}>
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
