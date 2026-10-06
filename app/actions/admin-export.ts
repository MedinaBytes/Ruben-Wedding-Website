"use server";

import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { resilientStore } from "@/lib/storage/resilient-store";

export interface WeddingDataExport {
  success: boolean;
  timestamp: string;
  counts: {
    invitations: number;
    rsvps: number;
    songRequests: number;
    tableAssignments: number;
    wishes: number;
  };
  csv: {
    guests: string;
    rsvps: string;
    seating: string;
  };
  data: {
    invitations: unknown[];
    rsvps: unknown[];
    songRequests: unknown[];
    tableAssignments: unknown[];
    wishes: unknown[];
    tables: unknown[];
    menuOptions: unknown[];
    settings: Record<string, unknown>;
  };
  error?: string;
}

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function convertToCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return [headerLine, ...rowLines].join("\n");
}

export async function exportAllWeddingDataAction(): Promise<WeddingDataExport> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      counts: { invitations: 0, rsvps: 0, songRequests: 0, tableAssignments: 0, wishes: 0 },
      csv: { guests: "", rsvps: "", seating: "" },
      data: { invitations: [], rsvps: [], songRequests: [], tableAssignments: [], wishes: [], tables: [], menuOptions: [], settings: {} },
      error: "Unauthorized: Admin authentication required for data export.",
    };
  }

  try {
    // 1. Gather all local store data
    const invitations = resilientStore.getInvitations();
    const rsvps = resilientStore.getRsvps();
    const songRequests = resilientStore.getSongRequests();
    const tableAssignments = resilientStore.getTableAssignments();
    const tables = resilientStore.getTables();
    const wishes = resilientStore.getWishes();
    const menuOptions = resilientStore.getMenuOptions();
    const settings = resilientStore.getSettings() as Record<string, unknown>;

    // 2. Build Guests CSV
    const guestCsvHeaders = [
      "ID",
      "Display Name",
      "Token",
      "Max Guests",
      "Plus One Allowed",
      "Group / Household",
      "Language",
      "Email",
      "Phone",
      "Status",
      "Created At",
    ];
    const guestCsvRows = invitations.map((inv) => [
      inv.id,
      inv.display_name,
      inv.token,
      inv.max_guests,
      inv.plus_one_allowed,
      inv.group_name ?? "",
      inv.language ?? "",
      inv.email ?? "",
      inv.phone ?? "",
      inv.status,
      inv.created_at,
    ]);
    const guestsCsv = convertToCsv(guestCsvHeaders, guestCsvRows);

    // 3. Build RSVPs CSV
    const rsvpCsvHeaders = [
      "Invitation ID",
      "Attending",
      "Headcount",
      "Guest Names",
      "Dietary Requirements",
      "Notes",
      "Submitted At",
      "Meal Choices",
    ];
    const rsvpCsvRows = rsvps.map((r) => [
      r.invitation_id,
      r.attendance_status,
      r.attendee_count,
      (r.guest_names || []).join(" | "),
      r.dietary_requirements ?? "",
      r.notes ?? "",
      r.submitted_at,
      JSON.stringify(r.meal_preferences || []),
    ]);
    const rsvpsCsv = convertToCsv(rsvpCsvHeaders, rsvpCsvRows);

    // 4. Build Seating CSV
    const seatingCsvHeaders = [
      "Guest Name",
      "Table Number",
      "Table Name",
      "Seat Number",
      "Notes",
    ];
    const seatingCsvRows = tableAssignments.map((a) => [
      a.guest_name,
      a.table_number,
      a.table_name,
      a.seat_number ?? "",
      a.notes ?? "",
    ]);
    const seatingCsv = convertToCsv(seatingCsvHeaders, seatingCsvRows);

    // 5. Audit log
    await recordAdminAudit({
      actor,
      action: "INVITATIONS_EXPORTED",
      resourceType: "guest_export",
      metadata: {
        format: "full_backup_csv_json",
        invitationCount: invitations.length,
        rsvpCount: rsvps.length,
      },
    });

    return {
      success: true,
      timestamp: new Date().toISOString(),
      counts: {
        invitations: invitations.length,
        rsvps: rsvps.length,
        songRequests: songRequests.length,
        tableAssignments: tableAssignments.length,
        wishes: wishes.length,
      },
      csv: {
        guests: guestsCsv,
        rsvps: rsvpsCsv,
        seating: seatingCsv,
      },
      data: {
        invitations,
        rsvps,
        songRequests,
        tableAssignments,
        wishes,
        tables,
        menuOptions,
        settings,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      counts: { invitations: 0, rsvps: 0, songRequests: 0, tableAssignments: 0, wishes: 0 },
      csv: { guests: "", rsvps: "", seating: "" },
      data: { invitations: [], rsvps: [], songRequests: [], tableAssignments: [], wishes: [], tables: [], menuOptions: [], settings: {} },
      error: err instanceof Error ? err.message : "Failed to generate complete data export",
    };
  }
}
