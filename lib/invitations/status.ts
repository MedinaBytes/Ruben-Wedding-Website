export type InvitationStatus = "NOT_OPENED" | "OPENED_PENDING" | "CONFIRMED" | "DECLINED" | "REVOKED";

export function deriveInvitationStatus({
  invitationStatus,
  wasOpened,
  attendanceStatus,
}: {
  invitationStatus: "active" | "draft" | "revoked";
  wasOpened: boolean;
  attendanceStatus: "yes" | "no" | null;
}): InvitationStatus {
  if (invitationStatus === "revoked") return "REVOKED";
  if (attendanceStatus === "yes") return "CONFIRMED";
  if (attendanceStatus === "no") return "DECLINED";
  return wasOpened ? "OPENED_PENDING" : "NOT_OPENED";
}

export function resolveLocalePreference(
  invitationLocale: string | undefined,
  manualLocale: string | undefined,
  browserLocale: string | undefined,
  supported: readonly string[],
) {
  if (invitationLocale && supported.includes(invitationLocale)) return invitationLocale;
  if (manualLocale && supported.includes(manualLocale)) return manualLocale;
  if (browserLocale && supported.includes(browserLocale)) return browserLocale;
  return "en";
}