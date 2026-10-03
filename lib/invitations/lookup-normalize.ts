import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";

export type NormalizedLookupValue =
  | { kind: "name"; value: string }
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string };

const emailSchema = z.string().email();
const phoneCharacters = /^[+\d\s().-]+$/;

export function normalizeName(value: string) {
  return value.normalize("NFC").trim().toLowerCase().replace(/\s+/gu, " ");
}

export function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  return emailSchema.safeParse(email).success ? email : null;
}

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!phoneCharacters.test(trimmed)) return null;
  const international = trimmed.replace(/^00/, "+");
  const phone = parsePhoneNumberFromString(international);
  return phone?.isValid() ? phone.number : null;
}

export function normalizeLookupValue(value: string): NormalizedLookupValue | null {
  const trimmed = value.normalize("NFC").trim();
  if (!trimmed) return null;

  if (trimmed.includes("@")) {
    const email = normalizeEmail(trimmed);
    return email ? { kind: "email", value: email } : null;
  }

  const isPhoneInput = phoneCharacters.test(trimmed)
    && ((trimmed.match(/\d/g)?.length ?? 0) >= 7 || trimmed.startsWith("+") || trimmed.startsWith("00"));
  if (isPhoneInput) {
    const phone = normalizePhone(trimmed);
    return phone ? { kind: "phone", value: phone } : null;
  }

  const name = normalizeName(trimmed);
  return name.length >= 2 ? { kind: "name", value: name } : null;
}
