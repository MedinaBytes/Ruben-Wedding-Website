"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { resilientStore, type StoredMenuOption } from "@/lib/storage/resilient-store";

export async function getMenuOptionsAction(): Promise<StoredMenuOption[]> {
  return resilientStore.getMenuOptions();
}

export async function saveMenuOptionAction(option: StoredMenuOption): Promise<StoredMenuOption[]> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) throw new Error("Unauthorized");

  const updated = resilientStore.saveMenuOption({
    ...option,
    name: option.name.trim(),
    icon: option.icon?.trim() || "🍽️",
  });

  try {
    await recordAdminAudit({
      actor,
      action: "INVITATION_UPDATED",
      resourceType: "invitation",
      metadata: { action: "MENU_OPTION_SAVED", optionId: option.id, optionName: option.name },
    });
  } catch {}

  revalidatePath("/admin/rsvps");
  revalidatePath("/");
  return updated;
}

export async function saveMenuOptionsAction(options: StoredMenuOption[]): Promise<StoredMenuOption[]> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) throw new Error("Unauthorized");

  const saved = resilientStore.saveMenuOptions(options);

  try {
    await recordAdminAudit({
      actor,
      action: "INVITATION_UPDATED",
      resourceType: "invitation",
      metadata: { action: "MENU_OPTIONS_CONFIGURED", count: options.length },
    });
  } catch {}

  revalidatePath("/admin/rsvps");
  revalidatePath("/");
  return saved;
}

export async function deleteMenuOptionAction(optionId: string): Promise<StoredMenuOption[]> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) throw new Error("Unauthorized");

  const updated = resilientStore.deleteMenuOption(optionId);

  try {
    await recordAdminAudit({
      actor,
      action: "INVITATION_UPDATED",
      resourceType: "invitation",
      metadata: { action: "MENU_OPTION_DELETED", optionId },
    });
  } catch {}

  revalidatePath("/admin/rsvps");
  revalidatePath("/");
  return updated;
}
