"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { resilientStore, type StoredTableAssignment } from "@/lib/storage/resilient-store";

export async function getTableAssignmentsAction(): Promise<StoredTableAssignment[]> {
  return resilientStore.getTableAssignments();
}

export async function saveTableAssignmentAction(data: {
  id?: string;
  tableNumber: number;
  tableName: string;
  guestName: string;
  seatNumber?: number;
  invitationId?: string;
  notes?: string;
}) {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) throw new Error("Unauthorized");

  const assignment: StoredTableAssignment = {
    id: data.id || `seat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    table_number: data.tableNumber,
    table_name: data.tableName,
    guest_name: data.guestName,
    seat_number: data.seatNumber,
    invitation_id: data.invitationId || "",
    notes: data.notes,
    created_at: new Date().toISOString(),
  };

  const saved = resilientStore.saveTableAssignment(assignment);

  try {
    await recordAdminAudit({
      actor,
      action: "INVITATION_UPDATED",
      resourceType: "invitation",
      metadata: { action: "SEATING_ASSIGNED", tableNumber: data.tableNumber, guestName: data.guestName },
    });
  } catch {}

  revalidatePath("/admin/seating");
  return saved;
}

export async function deleteTableAssignmentAction(id: string) {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) throw new Error("Unauthorized");

  resilientStore.deleteTableAssignment(id);

  try {
    await recordAdminAudit({
      actor,
      action: "INVITATION_UPDATED",
      resourceType: "invitation",
      metadata: { action: "SEATING_DELETED", assignmentId: id },
    });
  } catch {}

  revalidatePath("/admin/seating");
  return { success: true };
}

export async function getTablesAction() {
  return resilientStore.getTables();
}

export async function saveTableAction(table: {
  number: number;
  name: string;
  capacity: number;
}) {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) throw new Error("Unauthorized");

  const updatedTables = resilientStore.saveTable({
    number: table.number,
    name: table.name.trim(),
    capacity: Math.max(1, table.capacity),
  });

  try {
    await recordAdminAudit({
      actor,
      action: "INVITATION_UPDATED",
      resourceType: "invitation",
      metadata: { action: "TABLE_SAVED", tableNumber: table.number, tableName: table.name },
    });
  } catch {}

  revalidatePath("/admin/seating");
  return updatedTables;
}

export async function deleteTableAction(tableNumber: number) {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) throw new Error("Unauthorized");

  const updatedTables = resilientStore.deleteTable(tableNumber);

  try {
    await recordAdminAudit({
      actor,
      action: "INVITATION_UPDATED",
      resourceType: "invitation",
      metadata: { action: "TABLE_DELETED", tableNumber },
    });
  } catch {}

  revalidatePath("/admin/seating");
  return updatedTables;
}

