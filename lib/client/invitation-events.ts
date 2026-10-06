import type { Locale } from "@/lib/wedding-config";

export type InvitationInteractionEvent =
  | "RSVP_STARTED"
  | "LANGUAGE_CHANGED"
  | "MAP_OPENED"
  | "PLAYLIST_OPENED";

const transientSessions = new Map<string, string>();

function getSafeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getSessionId(invitationId: string) {
  const storageKey = `wedding-session:${invitationId}`;

  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const generated = getSafeId();
    sessionStorage.setItem(storageKey, generated);
    return generated;
  } catch {
    const existing = transientSessions.get(invitationId);
    if (existing) return existing;
    const generated = getSafeId();
    transientSessions.set(invitationId, generated);
    return generated;
  }
}

export function recordInvitationInteraction({
  token,
  invitationId,
  eventType,
  locale,
}: {
  token: string;
  invitationId: string;
  eventType: InvitationInteractionEvent;
  locale: Locale;
}) {
  const sessionId = getSessionId(invitationId);

  void fetch(`/api/invitation/${encodeURIComponent(token)}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, eventType, locale }),
    cache: "no-store",
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}