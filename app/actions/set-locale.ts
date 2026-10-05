"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { resolveLocale } from "@/lib/wedding-config";

const invitationIdSchema = z.string().uuid();

export async function setManualLocale(value: string, invitationId?: string) {
  const normalizedLocale = resolveLocale(value);
  if (!normalizedLocale) return;

  const parsedInvitationId = invitationIdSchema.safeParse(invitationId);
  const cookieStore = await cookies();

  const cookieOptions = {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 183,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" && process.env.VERCEL === "1",
  };

  cookieStore.set("wedding_manual_locale", normalizedLocale, cookieOptions);

  if (parsedInvitationId.success) {
    cookieStore.set(`wedding_manual_locale_${parsedInvitationId.data}`, normalizedLocale, cookieOptions);
  }

  revalidatePath("/", "layout");
}