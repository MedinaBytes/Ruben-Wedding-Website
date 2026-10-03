export function normalizeLookupValue(value: string) {
  const trimmed = value.trim().toLowerCase();
  const normalized = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const containsEmail = normalized.includes("@");

  if (containsEmail) {
    return normalized.replace(/\s+/g, "").trim();
  }

  const digitsOnly = normalized.replace(/\D+/g, "");
  if (digitsOnly.length >= 7) {
    return digitsOnly;
  }

  return normalized.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
