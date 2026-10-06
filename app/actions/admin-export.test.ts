import { describe, expect, it, vi } from "vitest";
import { exportAllWeddingDataAction } from "./admin-export";

vi.mock("@/lib/admin/auth", () => ({
  getAuthenticatedAdminIdentity: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@example.com" }),
}));

vi.mock("@/lib/admin/audit", () => ({
  recordAdminAudit: vi.fn(),
}));

vi.mock("@/lib/storage/resilient-store", () => ({
  resilientStore: {
    getInvitations: () => [
      {
        id: "inv-1",
        display_name: "Count von Count",
        token: "tok-1",
        max_guests: 2,
        plus_one_allowed: true,
        group_name: "Nobility",
        language: "de",
        email: "count@example.com",
        phone: "+43 1 2345",
        status: "active",
        created_at: "2026-10-06T12:00:00Z",
      },
    ],
    getRsvps: () => [
      {
        invitation_id: "inv-1",
        attendance_status: "yes",
        attendee_count: 2,
        guest_names: ["Count", "Countess"],
        dietary_requirements: "No garlic",
        notes: "Looking forward to it",
        submitted_at: "2026-10-06T13:00:00Z",
        meal_preferences: [{ guestName: "Count", meal: "classic" }],
      },
    ],
    getSongRequests: () => [],
    getTableAssignments: () => [
      {
        guest_name: "Count von Count",
        table_number: 1,
        table_name: "Ehrentisch",
        seat_number: 1,
        notes: "VIP",
      },
    ],
    getTables: () => [],
    getWishes: () => [],
    getMenuOptions: () => [],
    getSettings: () => ({ giftNote: "Imperial" }),
  },
}));

describe("Admin Data Export", () => {
  it("exports all tables into CSV and JSON structures", async () => {
    const backup = await exportAllWeddingDataAction();

    expect(backup.success).toBe(true);
    expect(backup.counts.invitations).toBe(1);
    expect(backup.counts.rsvps).toBe(1);
    expect(backup.counts.tableAssignments).toBe(1);

    expect(backup.csv.guests).toContain("Count von Count");
    expect(backup.csv.guests).toContain("Nobility");
    expect(backup.csv.rsvps).toContain("No garlic");
    expect(backup.csv.seating).toContain("Ehrentisch");

    expect(backup.data.invitations).toHaveLength(1);
    expect(backup.data.rsvps).toHaveLength(1);
  });
});
