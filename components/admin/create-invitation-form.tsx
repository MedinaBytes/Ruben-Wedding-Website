"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { supportedLocales } from "@/lib/wedding-config";

export function CreateInvitationForm({ labels }: { labels: Record<string, string> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");

  async function createInvitation(formData: FormData) {
    setMessage("");
    setInvitationUrl("");
    const maxGuests = Number(formData.get("maxGuests"));
    const response = await fetch("/api/admin/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        displayName: formData.get("displayName"),
        groupName: formData.get("groupName") || undefined,
        email: formData.get("email") || undefined,
        phone: formData.get("phone") || undefined,
        language: formData.get("language") || undefined,
        maxGuests,
        plusOneAllowed: formData.get("plusOneAllowed") === "on",
        status: "active",
      }),
    });
    const result = await response.json().catch(() => null) as { invitation?: { url: string }; error?: string } | null;

    if (!response.ok || !result?.invitation) {
      setMessage(labels.createInvitationError);
      return;
    }

    setInvitationUrl(result.invitation.url);
    setMessage(labels.createInvitationSuccess);
    startTransition(() => router.refresh());
  }

  return (
    <form action={createInvitation} className="admin-create-form">
      <div className="field-group">
        <label htmlFor="invitation-display-name">{labels.displayName}</label>
        <input autoComplete="off" id="invitation-display-name" maxLength={160} name="displayName" required type="text" />
      </div>
      <div className="field-group">
        <label htmlFor="invitation-group-name">{labels.groupName}</label>
        <input autoComplete="off" id="invitation-group-name" maxLength={160} name="groupName" type="text" />
      </div>
      <div className="field-group">
        <label htmlFor="invitation-email">{labels.lookupEmail}</label>
        <input autoComplete="email" id="invitation-email" maxLength={254} name="email" type="email" />
      </div>
      <div className="field-group">
        <label htmlFor="invitation-phone">{labels.lookupPhone}</label>
        <input autoComplete="tel" id="invitation-phone" maxLength={40} name="phone" type="tel" />
      </div>
      <div className="field-group">
        <label htmlFor="invitation-language">{labels.preferredLanguage}</label>
        <select defaultValue="" id="invitation-language" name="language">
          <option value="">{labels.languageDefault}</option>
          {supportedLocales.map((locale) => <option key={locale} value={locale}>{locale.toUpperCase()}</option>)}
        </select>
      </div>
      <div className="field-group">
        <label htmlFor="invitation-max-guests">{labels.guestPlaces}</label>
        <input defaultValue="1" id="invitation-max-guests" max="20" min="1" name="maxGuests" required type="number" />
      </div>
      <label className="choice-row" htmlFor="invitation-plus-one">
        <input id="invitation-plus-one" name="plusOneAllowed" type="checkbox" />
        <span>{labels.plusOneAllowed}</span>
      </label>
      <button className="text-button" disabled={isPending} type="submit">{isPending ? labels.creatingInvitation : labels.createInvitation}</button>
      {message && <p className="form-message" role="status">{message}</p>}
      {invitationUrl && <div className="admin-invitation-url"><label htmlFor="new-invitation-url">{labels.invitationUrl}</label><input id="new-invitation-url" readOnly value={invitationUrl} /></div>}
    </form>
  );
}
