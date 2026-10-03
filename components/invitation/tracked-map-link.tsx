"use client";

import { useLocale } from "next-intl";

import { recordInvitationInteraction } from "@/lib/client/invitation-events";
import type { Locale } from "@/lib/wedding-config";

export function TrackedMapLink({
  href,
  label,
  invitation,
}: {
  href: string;
  label: string;
  invitation?: { id: string; token: string };
}) {
  const locale = useLocale() as Locale;

  return (
    <a
      href={href}
      onClick={() => {
        if (invitation) {
          recordInvitationInteraction({
            invitationId: invitation.id,
            token: invitation.token,
            eventType: "MAP_OPENED",
            locale,
          });
        }
      }}
      rel="noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
}