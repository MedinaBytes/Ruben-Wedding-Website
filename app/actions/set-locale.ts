"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { supportedLocales } from "@/lib/wedding-config";

const localeSchema = z.enum(supportedLocales);

export async function setManualLocale(value: string) {
  const result = localeSchema.safeParse(value);
  if (!result.success) return;

  const cookieStore = await cookies();
  cookieStore.set("wedding_manual_locale", result.data, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 183,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}