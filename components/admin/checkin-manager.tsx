"use client";

import { useState, useTransition } from "react";
import { checkInGuestAction, removeCheckInAction } from "@/app/actions/admin-checkin";
import type { StoredCheckIn } from "@/lib/storage/resilient-store";

export interface CheckInGuestRow {
  invitationId: string;
  token: string;
  displayName: string;
  groupName?: string | null;
  maxGuests: number;
  attendeeCount: number;
  guestNames: string[];
  dietary?: string | null;
  notes?: string | null;
  tableNumber?: number | null;
  tableName?: string | null;
}

export function CheckInManager({
  initialCheckIns,
  guests,
  isEnabled = true,
}: {
  initialCheckIns: StoredCheckIn[];
  guests: CheckInGuestRow[];
  isEnabled?: boolean;
}) {
  const [checkIns, setCheckIns] = useState<StoredCheckIn[]>(initialCheckIns);
  const [search, setSearch] = useState("");
  const [scannerInput, setScannerInput] = useState("");
  const [recentlyChecked, setRecentlyChecked] = useState<CheckInGuestRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const checkedInMap = new Map(checkIns.map((c) => [c.invitation_id, c]));
  const totalArrivedGuests = checkIns.reduce((sum, c) => sum + (c.guest_count || 1), 0);
  const totalExpectedGuests = guests.reduce((sum, g) => sum + (g.attendeeCount || 1), 0);
  const progressPercent = totalExpectedGuests > 0 ? Math.round((totalArrivedGuests / totalExpectedGuests) * 100) : 0;

  const filteredGuests = guests.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.displayName.toLowerCase().includes(q) ||
      (g.groupName && g.groupName.toLowerCase().includes(q)) ||
      g.guestNames.some((n) => n.toLowerCase().includes(q)) ||
      g.token.toLowerCase() === q
    );
  });

  function performCheckIn(guest: CheckInGuestRow) {
    if (checkedInMap.has(guest.invitationId)) return;

    const newCheckIn: StoredCheckIn = {
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invitation_id: guest.invitationId,
      checked_in_at: new Date().toISOString(),
      guest_count: guest.attendeeCount || 1,
    };

    setCheckIns((prev) => [newCheckIn, ...prev]);
    setRecentlyChecked(guest);

    startTransition(async () => {
      await checkInGuestAction({
        invitationId: guest.invitationId,
        guestCount: guest.attendeeCount || 1,
      });
    });
  }

  function handleUndoCheckIn(invitationId: string) {
    const existing = checkedInMap.get(invitationId);
    if (!existing) return;

    setCheckIns((prev) => prev.filter((c) => c.invitation_id !== invitationId));
    if (recentlyChecked?.invitationId === invitationId) {
      setRecentlyChecked(null);
    }

    startTransition(async () => {
      await removeCheckInAction(existing.id);
    });
  }

  function handleManualTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = scannerInput.trim();
    if (!token) return;

    const matched = guests.find(
      (g) => g.token.toLowerCase() === token.toLowerCase() || g.invitationId === token,
    );

    if (matched) {
      performCheckIn(matched);
      setScannerInput("");
    } else {
      alert(`No guest invitation found matching token: "${token}"`);
    }
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Hero Arrival Stats */}
      <div
        style={{
          background: "linear-gradient(135deg, #8C2836 0%, #5E1420 100%)",
          color: "#FFF",
          borderRadius: "12px",
          padding: "1.75rem 2rem",
          marginBottom: "1.5rem",
          boxShadow: "0 8px 24px rgba(140, 40, 54, 0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.85 }}>
              Vienna Event Day · Live Guest Reception
            </span>
            <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2.2rem", margin: "0.25rem 0 0 0" }}>
              {totalArrivedGuests} / {totalExpectedGuests} Arrived
            </h1>
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700, opacity: 0.9 }}>
            {progressPercent}%
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "8px",
            background: "rgba(255, 255, 255, 0.25)",
            borderRadius: "999px",
            marginTop: "1.25rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(100, progressPercent)}%`,
              height: "100%",
              background: "#ECC57B",
              borderRadius: "999px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Fast QR / Barcode Input (Active only if QR Checkin is explicitly enabled) */}
      {isEnabled ? (
        <form
          onSubmit={handleManualTokenSubmit}
          style={{
            display: "flex",
            gap: "0.75rem",
            background: "#FFFFFF",
            padding: "1rem",
            borderRadius: "10px",
            border: "1px solid #E5DCD3",
            marginBottom: "1.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <input
            type="text"
            placeholder="Scan QR code or paste guest token (e.g. demo)..."
            value={scannerInput}
            onChange={(e) => setScannerInput(e.target.value)}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "6px",
              border: "1px solid #D5CBC4",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            style={{
              background: "#8C2836",
              color: "#FFF",
              border: 0,
              borderRadius: "6px",
              padding: "0.75rem 1.5rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ⚡ Check In
          </button>
        </form>
      ) : null}

      {/* Success Banner if recently checked in */}
      {recentlyChecked && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem 1.5rem",
            background: "#ECFDF5",
            border: "1px solid #6EE7B7",
            borderRadius: "8px",
            color: "#065F46",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
              ✅ Checked in: {recentlyChecked.displayName} ({recentlyChecked.attendeeCount} guests)
            </div>
            {recentlyChecked.tableNumber && (
              <div style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
                🪑 Table {recentlyChecked.tableNumber}: {recentlyChecked.tableName}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleUndoCheckIn(recentlyChecked.invitationId)}
            style={{
              background: "transparent",
              border: "1px solid #059669",
              color: "#065F46",
              borderRadius: "4px",
              padding: "0.3rem 0.6rem",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Undo
          </button>
        </div>
      )}

      {/* Search Guest List */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5DCD3", borderRadius: "10px", padding: "1.25rem" }}>
        <input
          type="text"
          placeholder="Filter guest name, table, or group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.6rem 0.85rem",
            borderRadius: "6px",
            border: "1px solid #D5CBC4",
            fontSize: "0.9rem",
            marginBottom: "1rem",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {filteredGuests.map((guest) => {
            const isChecked = checkedInMap.has(guest.invitationId);
            const checkInInfo = checkedInMap.get(guest.invitationId);

            return (
              <div
                key={guest.invitationId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "8px",
                  background: isChecked ? "rgba(85, 100, 78, 0.06)" : "#FAF8F6",
                  border: isChecked ? "1px solid rgba(85, 100, 78, 0.3)" : "1px solid #EBE4DD",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#2B2425" }}>
                      {guest.displayName}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "999px",
                        background: "#EBE4DD",
                        color: "#544648",
                      }}
                    >
                      {guest.attendeeCount} seats
                    </span>
                    {guest.tableNumber && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "999px",
                          background: "rgba(140, 40, 54, 0.1)",
                          color: "#8C2836",
                          fontWeight: 600,
                        }}
                      >
                        Table {guest.tableNumber}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "#6A5D60", marginTop: "0.25rem" }}>
                    {guest.guestNames.length > 0 && `Guests: ${guest.guestNames.join(", ")} · `}
                    Token: <code>{guest.token}</code>
                    {guest.dietary && ` · Diet: ${guest.dietary}`}
                  </div>
                </div>

                <div>
                  {isChecked ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.82rem", color: "#55644E", fontWeight: 600 }}>
                        ✓ Checked In ({new Date(checkInInfo!.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUndoCheckIn(guest.invitationId)}
                        disabled={isPending}
                        style={{
                          background: "transparent",
                          border: "1px solid #D5CBC4",
                          borderRadius: "4px",
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.75rem",
                          color: "#776A6C",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => performCheckIn(guest)}
                      disabled={isPending}
                      style={{
                        background: "#8C2836",
                        color: "#FFF",
                        border: 0,
                        borderRadius: "6px",
                        padding: "0.5rem 1rem",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Check In
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
