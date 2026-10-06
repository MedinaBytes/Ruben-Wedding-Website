"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

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

export function InviteOpenTracker({
  invitationId,
  token,
}: {
  invitationId: string;
  token: string;
}) {
  const locale = useLocale();

  useEffect(() => {
    const sessionKey = `wedding-session:${invitationId}`;
    const openedKey = `wedding-opened:${invitationId}`;
    let sessionId: string;

    try {
      if (sessionStorage.getItem(openedKey) === "true") return;
      sessionId = sessionStorage.getItem(sessionKey) ?? getSafeId();
      sessionStorage.setItem(sessionKey, sessionId);
    } catch {
      sessionId = getSafeId();
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const response = await fetch(`/api/invitation/${encodeURIComponent(token)}/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, locale }),
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (response.ok) {
          try {
            sessionStorage.setItem(openedKey, "true");
          } catch {
            return;
          }
        }
      } catch {
        return;
      }
    }, 1500);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [invitationId, locale, token]);

  return null;
}