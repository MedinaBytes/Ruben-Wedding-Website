import type { Locale } from "@/lib/wedding-config";

export type InvitationInteractionEvent =
  | "RSVP_STARTED"
  | "LANGUAGE_CHANGED"
  | "MAP_OPENED"
  | "PLAYLIST_OPENED";

const transientSessions = new Map<string, string>();

function getSessionId(invitationId: string) {
  const storageKey = `wedding-session:${invitationId}`;

  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const generated = crypto.randomUUID();
    sessionStorage.setItem(storageKey, generated);
    return generated;
  } catch {
    const existing = transientSessions.get(invitationId);
    if (existing) return existing;
    const generated = crypto.randomUUID();
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