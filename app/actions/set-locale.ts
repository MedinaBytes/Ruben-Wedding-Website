"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { supportedLocales } from "@/lib/wedding-config";

const localeSchema = z.enum(supportedLocales);
const invitationIdSchema = z.string().uuid();

export async function setManualLocale(value: string, invitationId?: string) {
  const result = localeSchema.safeParse(value);
  if (!result.success) return;

  const parsedInvitationId = invitationIdSchema.safeParse(invitationId);
  if (invitationId && !parsedInvitationId.success) return;

  const cookieStore = await cookies();
  const cookieName = parsedInvitationId.success
    ? `wedding_manual_locale_${parsedInvitationId.data}`
    : "wedding_manual_locale";
  cookieStore.set(cookieName, result.data, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 183,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}